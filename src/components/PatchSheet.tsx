import React from 'react';
import { CZ101Patch, LineData, Step } from '../types';

interface PatchDisplayProps {
  patch: CZ101Patch;
}

const EnvelopeTable = ({ title, steps, isPitch = false }: { title: string, steps: Step[], isPitch?: boolean }) => {
  const defaultSteps = Array.from({ length: 8 }, (_, i) => steps[i] || { rate: '', level: '', susEnd: 'NONE' });

  return (
    <div className="mb-4 text-[10px] w-full border border-gray-600 bg-black/40">
      <div className="text-center font-bold bg-gray-800 text-gray-200 py-0.5 border-b border-gray-600 uppercase">
        E N V ({title})
      </div>
      <table className="w-full text-center divide-y divide-gray-600">
        <thead>
          <tr className="bg-gray-700/50">
            <th className="py-1 px-1 border-r border-gray-600 font-semibold w-12">STEP</th>
            {defaultSteps.map((_, i) => (
              <th key={i} className="py-1 px-1 border-r border-gray-600 w-8">{i + 1}</th>
            ))}
            <th className="py-1 px-1 w-10 text-[8px] font-normal leading-tight">
              (0-99)<br/>
              {isPitch && <span className="opacity-0">.</span>}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          <tr>
            <td className="py-1 px-1 border-r border-gray-600 font-semibold text-leftpl-1">RATE</td>
            {defaultSteps.map((step, i) => (
              <td key={i} className="py-1 px-1 border-r border-gray-600 text-cyan-400 font-mono">
                {step.rate !== '' ? step.rate : ''}
              </td>
            ))}
            <td className="py-1 px-1 text-[8px]">{!isPitch && '(0-99)'}</td>
          </tr>
          <tr>
            <td className="py-1 px-1 border-r border-gray-600 font-semibold text-left pl-1">LEVEL</td>
            {defaultSteps.map((step, i) => (
              <td key={i} className="py-1 px-1 border-r border-gray-600 text-cyan-400 font-mono">
                {step.level !== '' ? step.level : ''}
              </td>
            ))}
            <td className="py-1 px-1 text-[8px]">{!isPitch && '(0-99)'}</td>
          </tr>
          <tr>
            <td className="py-1 px-1 border-r border-gray-600 font-semibold text-left pl-1">SUS/END</td>
            {defaultSteps.map((step, i) => (
              <td key={i} className="py-1 px-1 border-r border-gray-600 text-yellow-400 font-bold text-[8px]">
                {step.susEnd !== 'NONE' ? step.susEnd : ''}
              </td>
            ))}
            <td className="py-1 px-1"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const LineSection = ({ lineNum, data }: { lineNum: 1 | 2, data: LineData }) => {
  return (
    <div className="flex-1 min-w-[300px]">
      <div className="bg-gray-800 text-white font-bold px-2 py-1 inline-block mb-2 text-xl border border-gray-500 rounded-sm">
        {lineNum}
      </div>
      
      {/* DCO SECTION */}
      <div className="mb-2">
        <div className="bg-gray-200 text-black font-bold px-4 py-0.5 inline-block text-sm uppercase mb-1 border border-black shadow-[2px_2px_0_rgba(0,0,0,0.5)]">DCO {lineNum}</div>
        <div className="flex gap-2">
          <table className="text-[10px] text-center border border-gray-600 bg-black/40 h-fit">
            <thead>
              <tr><th colSpan={2} className="border-b border-gray-600 bg-gray-800 text-gray-200 py-0.5">WAVE FORM</th></tr>
              <tr className="bg-gray-700/50">
                <th className="font-normal px-2 py-0.5 border-r border-gray-600 border-b">FIRST</th>
                <th className="font-normal px-2 py-0.5 border-b border-gray-600">SECOND</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-2 border-r border-gray-600 text-cyan-400 text-lg font-mono">
                  {data.dco.waveFirst}
                </td>
                <td className="px-2 py-2 text-cyan-400 text-lg font-mono">
                  {data.dco.waveSecond !== 0 ? data.dco.waveSecond : ''}
                </td>
              </tr>
              <tr className="text-[8px] text-gray-400">
                <td className="px-1 border-r border-gray-600 pt-1 pb-0.5 border-t">(1-8)</td>
                <td className="px-1 pt-1 pb-0.5 border-t border-gray-600">(0-8)</td>
              </tr>
            </tbody>
          </table>
          <div className="flex-grow">
            <EnvelopeTable title="PITCH" steps={data.dco.env.steps} isPitch={true} />
          </div>
        </div>
      </div>

      {/* DCW SECTION */}
      <div className="mb-2">
        <div className="bg-gray-200 text-black font-bold px-4 py-0.5 inline-block text-sm uppercase mb-1 border border-black shadow-[2px_2px_0_rgba(0,0,0,0.5)]">DCW {lineNum}</div>
        <div className="flex gap-2">
           <table className="text-[10px] text-center border border-gray-600 bg-black/40 h-fit mb-2">
             <thead>
               <tr><th className="border-b border-gray-600 bg-gray-800 text-gray-200 py-0.5 px-2">KEY FOLLOW</th></tr>
             </thead>
             <tbody>
               <tr>
                 <td className="px-2 py-2 text-cyan-400 text-lg font-mono">
                   {data.dcw.keyFollow}
                 </td>
               </tr>
               <tr>
                 <td className="text-[8px] text-gray-400 px-1 pt-1 pb-0.5 border-t border-gray-600">(0-9)</td>
               </tr>
             </tbody>
           </table>
           <div className="flex-grow">
              <EnvelopeTable title="WAVE" steps={data.dcw.env.steps} />
           </div>
        </div>
      </div>

      {/* DCA SECTION */}
      <div className="mb-2">
        <div className="bg-gray-200 text-black font-bold px-4 py-0.5 inline-block text-sm uppercase mb-1 border border-black shadow-[2px_2px_0_rgba(0,0,0,0.5)]">DCA {lineNum}</div>
         <div className="flex gap-2">
           <table className="text-[10px] text-center border border-gray-600 bg-black/40 h-fit mb-2">
             <thead>
               <tr><th className="border-b border-gray-600 bg-gray-800 text-gray-200 py-0.5 px-2">KEY FOLLOW</th></tr>
             </thead>
             <tbody>
               <tr>
                 <td className="px-2 py-2 text-cyan-400 text-lg font-mono">
                   {data.dca.keyFollow}
                 </td>
               </tr>
               <tr>
                 <td className="text-[8px] text-gray-400 px-1 pt-1 pb-0.5 border-t border-gray-600">(0-9)</td>
               </tr>
             </tbody>
           </table>
           <div className="flex-grow">
              <EnvelopeTable title="AMP" steps={data.dca.env.steps} />
           </div>
        </div>
      </div>
    </div>
  );
};

export const PatchDisplay: React.FC<PatchDisplayProps> = ({ patch }) => {
  return (
    <div className="max-w-5xl mx-auto bg-[#1a1b1e] text-gray-300 p-6 rounded-xl shadow-2xl border border-gray-700 font-sans mt-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="bg-white text-black font-extrabold uppercase px-6 py-2 text-xl tracking-wider border-2 border-black inline-block shadow-[4px_4px_0_rgba(0,0,0,1)]">
          PARAMETER
        </div>
        <table className="flex-grow text-sm text-center border-2 border-gray-500 bg-black/50">
          <thead>
            <tr className="bg-gray-800/80 text-gray-200">
              <th className="border-r-2 border-b-2 border-gray-500 py-1 w-2/3">TONE NAME</th>
              <th className="border-r-2 border-b-2 border-gray-500 py-1">CARTRIDGE NO.</th>
              <th className="border-b-2 border-gray-500 py-1">TONE NO.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r-2 border-gray-500 py-3 text-2xl font-mono text-emerald-400 uppercase tracking-widest">{patch.toneName}</td>
              <td className="border-r-2 border-gray-500 py-3"></td>
              <td className="py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Global Params Row */}
      <div className="flex flex-wrap gap-2 text-[10px] mb-8 justify-between">
        
        {/* Line Select */}
        <table className="border border-gray-600 bg-black/40 text-center">
          <thead>
            <tr><th className="bg-gray-800 text-gray-200 border-b border-gray-600 px-3 py-0.5 whitespace-nowrap">LINE SELECT</th></tr>
          </thead>
          <tbody>
            <tr><td className="px-4 py-2 text-cyan-400 font-mono text-lg">{patch.lineSelect}</td></tr>
            <tr><td className="text-[8px] text-gray-400 pt-1 pb-0.5 border-t border-gray-600">(1,2,1+1',1+2)</td></tr>
          </tbody>
        </table>

        {/* Modulation */}
        <table className="border border-gray-600 bg-black/40 text-center">
          <thead>
            <tr><th colSpan={2} className="bg-gray-800 text-gray-200 border-b border-gray-600 py-0.5">MODULATION</th></tr>
            <tr className="bg-gray-700/50">
              <th className="px-3 py-0.5 border-r border-b border-gray-600 font-normal">RING</th>
              <th className="px-3 py-0.5 border-b border-gray-600 font-normal">NOISE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 border-r border-gray-600 text-cyan-400 font-mono text-base">{patch.modulation.ring ? 'ON' : 'OFF'}</td>
              <td className="px-3 py-2 text-cyan-400 font-mono text-base">{patch.modulation.noise ? 'ON' : 'OFF'}</td>
            </tr>
            <tr><td colSpan={2} className="text-[8px] text-gray-400 pt-1 pb-0.5 border-t border-gray-600">(ON/OFF)</td></tr>
          </tbody>
        </table>

        {/* Detune */}
        <table className="border border-gray-600 bg-black/40 text-center">
          <thead>
            <tr><th colSpan={4} className="bg-gray-800 text-gray-200 border-b border-gray-600 py-0.5">DETUNE</th></tr>
            <tr className="bg-gray-700/50">
              <th className="px-2 py-0.5 border-r border-b border-gray-600 font-normal">+/-</th>
              <th className="px-2 py-0.5 border-r border-b border-gray-600 font-normal">OCTAVE</th>
              <th className="px-2 py-0.5 border-r border-b border-gray-600 font-normal">NOTE</th>
              <th className="px-3 py-0.5 border-b border-gray-600 font-normal">FINE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-2 border-r border-gray-600 text-cyan-400 font-mono text-base">{patch.detune.sign}</td>
              <td className="px-2 py-2 border-r border-gray-600 text-cyan-400 font-mono text-base">{patch.detune.octave}</td>
              <td className="px-2 py-2 border-r border-gray-600 text-cyan-400 font-mono text-base">{patch.detune.note}</td>
              <td className="px-2 py-2 text-cyan-400 font-mono text-base">{patch.detune.fine}</td>
            </tr>
            <tr className="text-[8px] text-gray-400">
               <td className="pt-1 pb-0.5 border-t border-r border-gray-600">(+/-)</td>
               <td className="pt-1 pb-0.5 border-t border-r border-gray-600">(0-3)</td>
               <td className="pt-1 pb-0.5 border-t border-r border-gray-600">(0-11)</td>
               <td className="pt-1 pb-0.5 border-t border-gray-600">(0-60)</td>
            </tr>
          </tbody>
        </table>
        
        {/* Vibrato */}
        <table className="border border-gray-600 bg-black/40 text-center">
          <thead>
            <tr><th colSpan={4} className="bg-gray-800 text-gray-200 border-b border-gray-600 py-0.5">VIBRATO</th></tr>
            <tr className="bg-gray-700/50">
              <th className="px-2 py-0.5 border-r border-b border-gray-600 font-normal">WAVE</th>
              <th className="px-2 py-0.5 border-r border-b border-gray-600 font-normal">DELAY</th>
              <th className="px-2 py-0.5 border-r border-b border-gray-600 font-normal">RATE</th>
              <th className="px-2 py-0.5 border-b border-gray-600 font-normal">DEPTH</th>
            </tr>
          </thead>
          <tbody>
            <tr>
               <td className="px-2 py-2 border-r border-gray-600 text-cyan-400 font-mono text-base">{patch.vibrato.wave}</td>
               <td className="px-2 py-2 border-r border-gray-600 text-cyan-400 font-mono text-base">{patch.vibrato.delay}</td>
               <td className="px-2 py-2 border-r border-gray-600 text-cyan-400 font-mono text-base">{patch.vibrato.rate}</td>
               <td className="px-2 py-2 text-cyan-400 font-mono text-base">{patch.vibrato.depth}</td>
            </tr>
            <tr className="text-[8px] text-gray-400">
               <td className="pt-1 pb-0.5 border-t border-r border-gray-600">(1-4)</td>
               <td className="pt-1 pb-0.5 border-t border-r border-gray-600">(0-99)</td>
               <td className="pt-1 pb-0.5 border-t border-r border-gray-600">(0-99)</td>
               <td className="pt-1 pb-0.5 border-t border-gray-600">(0-99)</td>
            </tr>
          </tbody>
        </table>

        {/* Octave */}
        <table className="border border-gray-600 bg-black/40 text-center">
          <thead>
            <tr><th colSpan={2} className="bg-gray-800 text-gray-200 border-b border-gray-600 py-0.5">OCTAVE</th></tr>
            <tr className="bg-gray-700/50">
              <th className="px-2 py-0.5 border-r border-b border-gray-600 font-normal">+/-</th>
              <th className="px-2 py-0.5 border-b border-gray-600 font-normal">RANGE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 border-r border-gray-600 text-cyan-400 font-mono text-base">{patch.octave.sign}</td>
              <td className="px-3 py-2 text-cyan-400 font-mono text-base">{patch.octave.range}</td>
            </tr>
            <tr className="text-[8px] text-gray-400">
               <td className="pt-1 pb-0.5 border-t border-r border-gray-600">(+/-)</td>
               <td className="pt-1 pb-0.5 border-t border-gray-600">(0-1)</td>
            </tr>
          </tbody>
        </table>

      </div>

      {/* Main Lines Container */}
      <div className="flex flex-col xl:flex-row gap-8">
        <LineSection lineNum={1} data={patch.line1} />
        <LineSection lineNum={2} data={patch.line2} />
      </div>

      {/* Footer Comment */}
      <div className="mt-8 border-t-2 border-gray-700 pt-4 pb-2">
        <div className="font-bold text-sm mb-1 uppercase tracking-widest text-gray-400">COMMENT</div>
        <div className="font-mono text-yellow-400 text-lg uppercase tracking-wide">
          {patch.comment}
        </div>
      </div>
    </div>
  );
};
