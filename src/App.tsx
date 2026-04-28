import React, { useState, useEffect } from 'react';
import { Settings2, Loader2, Wand2, Play, Save, Library, Trash2, LogIn, LogOut } from 'lucide-react';
import { generatePatch } from './services/gemini';
import { PatchDisplay } from './components/PatchSheet';
import { CZ101Patch, SavedPatch } from './types';
import { playPatchPreview } from './services/audio';
import { auth, db } from './services/firebase';
import { handleFirestoreError, OperationType } from './services/dbUtils';
import { collection, query, onSnapshot, setDoc, doc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [prompt, setPrompt] = useState('Timpani Drums');
  const [loading, setLoading] = useState(false);
  const [patch, setPatch] = useState<CZ101Patch | null>(null);
  const [error, setError] = useState('');
  const [library, setLibrary] = useState<SavedPatch[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Migrate localStorage patches to Firestore
        const saved = localStorage.getItem('cz_patches');
        if (saved) {
          try {
            const localLibrary: SavedPatch[] = JSON.parse(saved);
            for (const localPatch of localLibrary) {
              const patchToSave = {
                userId: currentUser.uid,
                toneName: localPatch.toneName,
                comment: localPatch.comment,
                patchData: localPatch,
                createdAt: localPatch.createdAt || Date.now()
              };
              await setDoc(doc(db, 'patches', localPatch.id), patchToSave);
            }
            // Clear localStorage after successful migration
            localStorage.removeItem('cz_patches');
          } catch(e) {
            console.error('Failed to migrate local patches', e);
          }
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setLibrary([]);
      return;
    }

    const q = query(
      collection(db, 'patches'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribeDB = onSnapshot(q, (snapshot) => {
      const patchesFetch: SavedPatch[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        patchesFetch.push({
          id: doc.id,
          createdAt: data.createdAt,
          toneName: data.toneName,
          comment: data.comment,
          ...data.patchData
        } as SavedPatch);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'patches');
      });
      setLibrary(patchesFetch);
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, 'patches');
    });

    return () => unsubscribeDB();
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      alert('Erro ao fazer login com o Google.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSavePatch = async () => {
    if (!patch) return;
    if (!user) {
      alert('Faça o login para salvar seus patches na nuvem!');
      return;
    }
    
    const isAlreadySaved = library.some(p => p.toneName === patch.toneName && p.comment === patch.comment);
    if (isAlreadySaved) {
      alert('Este patch já foi salvo!');
      return;
    }

    const id = Date.now().toString();
    const patchToSave = {
      userId: user.uid,
      toneName: patch.toneName,
      comment: patch.comment,
      patchData: patch,
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'patches', id), patchToSave);
      setShowLibrary(true);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `patches/${id}`);
    }
  };

  const handleDeletePatch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'patches', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `patches/${id}`);
    }
  };

  const loadPatch = (savedPatch: SavedPatch) => {
    const { id, createdAt, ...rest } = savedPatch;
    setPatch(rest as CZ101Patch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const generatedPatch = await generatePatch(prompt);
      setPatch(generatedPatch);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Falha ao gerar o patch. Verifique se a sua GEMINI_API_KEY está configurada no painel "Secrets".');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-cyan-900 selection:text-cyan-100 pb-20">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
              <Settings2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
                CZ-Patch<span className="text-cyan-400">Gen</span>
              </h1>
              <p className="text-xs text-neutral-400 font-medium">Casio CZ-101 AI Sound Designer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400 hidden md:inline">
                  {user.email}
                </span>
                <button 
                  onClick={() => setShowLibrary(!showLibrary)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showLibrary ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
                >
                  <Library className="w-5 h-5" />
                  <span className="hidden sm:inline">Biblioteca</span>
                  {library.length > 0 && (
                    <span className="bg-cyan-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      {library.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-neutral-800/50 hover:bg-red-500/20 hover:text-red-400 text-neutral-300 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-6 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg font-bold transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span>Entrar (Google)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-12">
        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-extrabold mb-4 tracking-tight text-white">
            Descreva o som que você deseja criar
          </h2>
          <p className="text-neutral-400 mb-8 max-w-lg mx-auto">
            A inteligência artificial irá traduzir a sua ideia em parâmetros exatos de síntese Phase Distortion para o Casio CZ-101.
          </p>

          <form onSubmit={handleGenerate} className="relative group flex flex-col items-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex w-full flex-col sm:flex-row gap-2 bg-neutral-900 p-2 rounded-xl ring-1 ring-neutral-800 focus-within:ring-cyan-500/50 shadow-2xl">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Baixo agressivo anos 80, Pad espacial envolvente..."
                className="w-full bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder:text-neutral-600 text-lg"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="whitespace-nowrap bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Criar Patch
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Output Section */}
        <div className="flex justify-center w-full">
          {patch && !loading && (
            <div className="w-full max-w-full overflow-x-auto pb-8 flex flex-col items-center">
              <div className="flex flex-wrap gap-4 mb-6 relative z-0">
                <button 
                  onClick={() => {
                    alert("Aviso: O Casio CZ usa Síntese por Distorção de Fase (PD), que é muito complexa. Este preview no navegador usa síntese subtrativa básica (filtros, osciladores simples) apenas para te dar uma pequena ideia do envelope e andamento rítmico do patch. O timbre sonoro no seu CZ real soará BEM MUDADO e muito mais rico!");
                    playPatchPreview(patch);
                  }}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  Ouvir Preview (Aprox)
                </button>
                <button 
                  onClick={handleSavePatch}
                  className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-all"
                >
                  <Save className="w-5 h-5" />
                  Salvar na Biblioteca
                </button>
              </div>
              <PatchDisplay patch={patch} />
            </div>
          )}
        </div>

        {/* Library Section */}
        {showLibrary && (
          <div className="mt-12 border-t border-neutral-800 pt-12">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Library className="w-6 h-6 text-cyan-400" />
              Patches Salvos
            </h3>
            
            {library.length === 0 ? (
              <div className="text-center bg-neutral-900/50 rounded-xl border border-neutral-800 p-12 text-neutral-500">
                Sua biblioteca está vazia. Gere um som legal e salve-o para o seu histórico aqui!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {library.map((saved) => (
                  <div 
                    key={saved.id}
                    onClick={() => loadPatch(saved)}
                    className="group cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 p-4 rounded-xl shadow-lg transition-all hover:bg-neutral-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors uppercase font-mono truncate mr-2">
                        {saved.toneName}
                      </h4>
                      <button 
                        onClick={(e) => handleDeletePatch(saved.id, e)}
                        className="text-neutral-500 hover:text-red-400 p-1 bg-black/20 rounded-md transition-colors"
                        title="Excluir Patch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-neutral-400 line-clamp-2 min-h-[40px]">
                      {saved.comment}
                    </p>
                    <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-500 font-mono">
                      <span>Line: {saved.lineSelect}</span>
                      <span>
                        {new Date(saved.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
