import React from 'react';
import { ISMElement } from '../types';
import { Tag } from 'lucide-react';

interface Props {
  factors: ISMElement[];
  setFactors: React.Dispatch<React.SetStateAction<ISMElement[]>>;
  topic: string;
  onNext: () => void;
}

const FactorInput: React.FC<Props> = ({ factors, onNext }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Model Factors</h2>
          <p className="text-slate-500">The following are the {factors.length} most critical factors identified from literature review and responses collected from questionnaires answered by AEC industry personnel.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xl">
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {factors.map((factor, idx) => (
            <div key={factor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 text-slate-700 text-xs font-mono font-bold border border-slate-300">
                  {factor.name}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-900 font-medium truncate">{factor.description || factor.name}</p>
                    {factor.category && (
                      <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                        {factor.category}
                      </span>
                    )}
                  </div>
                  {factor.category && (
                     <span className="md:hidden inline-flex items-center gap-1 text-[10px] text-indigo-500 mt-1">
                        <Tag className="w-3 h-3" /> {factor.category}
                     </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-xs text-slate-400">
            Total Factors: {factors.length}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02]"
        >
          Next: Build SSIM Matrix
        </button>
      </div>
    </div>
  );
};

export default FactorInput;