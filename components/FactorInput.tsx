import React, { useState } from 'react';
import { ISMElement } from '../types';
import { Tag, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface Props {
  factors: ISMElement[];
  setFactors: React.Dispatch<React.SetStateAction<ISMElement[]>>;
  topic: string;
  onNext: () => void;
}

// Helper to get category color
export const getCategoryColorClasses = (category?: string) => {
  switch (category) {
    case 'Management': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Cost': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Organization': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Technology': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'Knowledge': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Process': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Policy': return 'bg-slate-200 text-slate-800 border-slate-300';
    default: return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
};

const CATEGORIES = ['Management', 'Cost', 'Organization', 'Technology', 'Knowledge', 'Process', 'Policy', 'Environment', 'Safety', 'Other'];

const FactorInput: React.FC<Props> = ({ factors, setFactors, onNext }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ISMElement>>({});
  
  // New Factor State
  const [isAdding, setIsAdding] = useState(false);
  const [newFactor, setNewFactor] = useState({ name: '', description: '', category: 'Management' });

  // Add Factor Handler
  const handleAddFactor = () => {
    if (!newFactor.name.trim() || !newFactor.description.trim()) {
      alert("Name and Description are required.");
      return;
    }
    
    const factor: ISMElement = {
      id: crypto.randomUUID(),
      name: newFactor.name.trim(),
      description: newFactor.description.trim(),
      category: newFactor.category
    };

    setFactors([...factors, factor]);
    setNewFactor({ name: '', description: '', category: 'Management' });
    setIsAdding(false);
  };

  // Delete Factor Handler
  const handleDeleteFactor = (id: string) => {
    if (confirm("Are you sure you want to delete this factor? This will remove any existing relationships involving this factor.")) {
      setFactors(factors.filter(f => f.id !== id));
    }
  };

  // Start Edit
  const startEdit = (factor: ISMElement) => {
    setEditingId(factor.id);
    setEditValues({ ...factor });
  };

  // Save Edit
  const saveEdit = () => {
    setFactors(factors.map(f => f.id === editingId ? { ...f, ...editValues } as ISMElement : f));
    setEditingId(null);
    setEditValues({});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Model Factors</h2>
          <p className="text-slate-500">Manage the critical factors identified for the sustainability model.</p>
        </div>
        <button 
           onClick={() => setIsAdding(!isAdding)}
           className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isAdding ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
        >
          {isAdding ? <><X className="w-4 h-4"/> Cancel</> : <><Plus className="w-4 h-4"/> Add Factor</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-emerald-800 mb-3 text-sm">New Factor Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-2">
                    <input 
                        type="text" 
                        placeholder="Code (e.g. F12)"
                        value={newFactor.name}
                        onChange={e => setNewFactor({...newFactor, name: e.target.value})}
                        className="w-full p-2 rounded border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="md:col-span-6">
                    <input 
                        type="text" 
                        placeholder="Description (e.g. Lack of...)"
                        value={newFactor.description}
                        onChange={e => setNewFactor({...newFactor, description: e.target.value})}
                        className="w-full p-2 rounded border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <select 
                        value={newFactor.category}
                        onChange={e => setNewFactor({...newFactor, category: e.target.value})}
                        className="w-full p-2 rounded border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2 flex items-center">
                    <button 
                        onClick={handleAddFactor}
                        className="w-full py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-xl shadow-emerald-500/5">
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {factors.map((factor) => {
             const isEditing = editingId === factor.id;
             const catColor = getCategoryColorClasses(factor.category);
             
             if (isEditing) {
                 return (
                    <div key={factor.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                        <div className="md:col-span-2">
                            <input 
                                value={editValues.name || ''}
                                onChange={e => setEditValues({...editValues, name: e.target.value})}
                                className="w-full p-1.5 text-sm rounded border border-slate-300 outline-none"
                                placeholder="Name"
                            />
                        </div>
                        <div className="md:col-span-6">
                            <input 
                                value={editValues.description || ''}
                                onChange={e => setEditValues({...editValues, description: e.target.value})}
                                className="w-full p-1.5 text-sm rounded border border-slate-300 outline-none"
                                placeholder="Description"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <select 
                                value={editValues.category}
                                onChange={e => setEditValues({...editValues, category: e.target.value})}
                                className="w-full p-1.5 text-sm rounded border border-slate-300 outline-none"
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2 justify-end">
                            <button onClick={saveEdit} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Save">
                                <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300" title="Cancel">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                 );
             }

             return (
              <div key={factor.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-colors group">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-xs font-mono font-bold border ${catColor}`}>
                    {factor.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-slate-900 font-medium truncate">{factor.description || factor.name}</p>
                      {factor.category && (
                        <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${catColor}`}>
                          {factor.category}
                        </span>
                      )}
                    </div>
                    {factor.category && (
                       <span className={`md:hidden inline-flex items-center gap-1 text-[10px] mt-1 px-1.5 py-0.5 rounded border ${catColor}`}>
                          <Tag className="w-3 h-3" /> {factor.category}
                       </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button 
                        onClick={() => startEdit(factor)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Edit Factor"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDeleteFactor(factor.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Factor"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-right text-xs text-slate-400">
            Total Factors: {factors.length}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02]"
        >
          Next: Build SSIM Matrix
        </button>
      </div>
    </div>
  );
};

export default FactorInput;