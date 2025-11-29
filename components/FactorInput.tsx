import React, { useState, useMemo, useRef } from 'react';
import { ISMElement } from '../types';
import { Tag, Plus, Trash2, Edit2, Save, X, Upload, FileJson, FileText, Trash, FileDown } from 'lucide-react';

interface Props {
  factors: ISMElement[];
  setFactors: React.Dispatch<React.SetStateAction<ISMElement[]>>;
  topic: string;
  onNext: () => void;
}

// Centralized Color Palette
const PALETTE = [
  { name: 'Blue', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', borderL: 'border-l-blue-400', hex: '#3b82f6' },
  { name: 'Rose', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', borderL: 'border-l-rose-400', hex: '#e11d48' },
  { name: 'Purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', borderL: 'border-l-purple-400', hex: '#9333ea' },
  { name: 'Cyan', bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', borderL: 'border-l-cyan-400', hex: '#0891b2' },
  { name: 'Amber', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', borderL: 'border-l-amber-400', hex: '#d97706' },
  { name: 'Orange', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', borderL: 'border-l-orange-400', hex: '#ea580c' },
  { name: 'Slate', bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-300', borderL: 'border-l-slate-400', hex: '#475569' },
  { name: 'Emerald', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', borderL: 'border-l-emerald-400', hex: '#10b981' },
  { name: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', borderL: 'border-l-indigo-400', hex: '#4f46e5' },
  { name: 'Pink', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', borderL: 'border-l-pink-400', hex: '#db2777' },
  { name: 'Teal', bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', borderL: 'border-l-teal-400', hex: '#14b8a6' },
  { name: 'Lime', bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200', borderL: 'border-l-lime-400', hex: '#84cc16' },
];

const KNOWN_MAPPINGS: Record<string, number> = {
  'Management': 0,
  'Cost': 1,
  'Organization': 2,
  'Technology': 3,
  'Knowledge': 4,
  'Process': 5,
  'Policy': 6,
  'Environment': 7,
  'Safety': 8,
};

// Helper to get category theme (Dynamic)
export const getCategoryTheme = (category?: string) => {
  if (!category) return PALETTE[7]; // Default Emerald
  
  // Check known mappings first
  if (KNOWN_MAPPINGS[category] !== undefined) {
    return PALETTE[KNOWN_MAPPINGS[category]];
  }
  
  // Hash string for consistent random color
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export const getCategoryColorClasses = (category?: string) => {
  const theme = getCategoryTheme(category);
  return `${theme.bg} ${theme.text} ${theme.border}`;
};

export const getCategoryColorHex = (category?: string) => getCategoryTheme(category).hex;

const DEFAULT_CATEGORIES = ['Management', 'Cost', 'Organization', 'Technology', 'Knowledge', 'Process', 'Policy', 'Environment', 'Safety'];

const FactorInput: React.FC<Props> = ({ factors, setFactors, onNext }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ISMElement>>({});
  
  // New Factor State
  const [isAdding, setIsAdding] = useState(false);
  const [newFactor, setNewFactor] = useState({ name: '', description: '', category: 'Management' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute unique categories for suggestion list
  const availableCategories = useMemo(() => {
    const existing = new Set(factors.map(f => f.category || '').filter(Boolean));
    DEFAULT_CATEGORIES.forEach(c => existing.add(c));
    return Array.from(existing).sort();
  }, [factors]);

  // Add Factor Handler
  const handleAddFactor = () => {
    if (!newFactor.name.trim() || !newFactor.description.trim()) {
      alert("Name and Description are required.");
      return;
    }
    
    const factor: ISMElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
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

  // Clear All
  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete ALL factors? This cannot be undone.")) {
      setFactors([]);
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

  // CSV Helper
  const parseCSV = (text: string): ISMElement[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    
    // Normalize headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    
    const parsedFactors: ISMElement[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Split by comma, handling quotes roughly
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        
        const factor: any = { 
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) 
        };
        
        headers.forEach((h, idx) => {
            if (values[idx] !== undefined) {
                if (h === 'id') factor.id = values[idx];
                else if (h === 'name' || h === 'factor') factor.name = values[idx];
                else if (h === 'description' || h === 'desc') factor.description = values[idx];
                else if (h === 'category' || h === 'cat') factor.category = values[idx];
            }
        });

        if (factor.name) {
            parsedFactors.push(factor as ISMElement);
        }
    }
    return parsedFactors;
  };

  // Import Handler
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
            if (file.name.toLowerCase().endsWith('.csv')) {
                const parsed = parseCSV(text);
                if (parsed.length > 0) {
                    setFactors(parsed);
                    alert(`Successfully imported ${parsed.length} factors.`);
                } else {
                    alert("No valid factors found in CSV.");
                }
            } else {
                // Assume JSON
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed) && parsed.length > 0) {
                     setFactors(parsed);
                     alert(`Successfully imported ${parsed.length} factors.`);
                } else {
                     alert("Invalid JSON format. Expected an array of factors.");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Failed to parse file. Please check the format.");
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const triggerImport = () => fileInputRef.current?.click();

  // Export Logic
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(factors, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Factors_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ["id", "name", "description", "category"];
    const rows = factors.map(f => [
        `"${f.id}"`,
        `"${f.name.replace(/"/g, '""')}"`,
        `"${(f.description || '').replace(/"/g, '""')}"`,
        `"${(f.category || '').replace(/"/g, '""')}"`
    ].join(","));
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Factors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const headers = "id,name,description,category";
    const sampleRow = "F1,Sample Factor,Description of the factor,Management";
    const csvContent = `${headers}\n${sampleRow}`;
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "ISM_Factors_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Model Factors</h2>
          <p className="text-slate-500">Manage the critical factors identified for the sustainability model.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           <input type="file" ref={fileInputRef} className="hidden" accept=".json,.csv" onChange={handleImport} />
           
           <button 
             onClick={handleDownloadTemplate}
             className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
             title="Download CSV Template"
           >
             <FileDown className="w-4 h-4" /> Template
           </button>

           <button 
             onClick={triggerImport}
             className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
             title="Import from JSON or CSV"
           >
             <Upload className="w-4 h-4" /> Import
           </button>
           
           <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden divide-x divide-slate-200">
             <button 
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                title="Export as JSON"
             >
                <FileJson className="w-4 h-4" /> JSON
             </button>
             <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                title="Export as CSV"
             >
                <FileText className="w-4 h-4" /> CSV
             </button>
           </div>

           <button 
             onClick={handleClearAll}
             className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
             title="Remove All Factors"
           >
             <Trash className="w-4 h-4" /> Clear
           </button>

           <div className="w-px h-6 bg-slate-300 mx-1 hidden md:block"></div>

           <button 
              onClick={() => setIsAdding(!isAdding)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isAdding ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
           >
             {isAdding ? <><X className="w-4 h-4"/> Cancel</> : <><Plus className="w-4 h-4"/> Add Factor</>}
           </button>
        </div>
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
                    <input 
                        list="category-options-new"
                        type="text"
                        placeholder="Category"
                        value={newFactor.category}
                        onChange={e => setNewFactor({...newFactor, category: e.target.value})}
                        className="w-full p-2 rounded border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <datalist id="category-options-new">
                        {availableCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
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
          {factors.length === 0 && (
             <div className="text-center py-10 text-slate-400">
                 <p>No factors defined yet.</p>
                 <p className="text-sm">Add a factor manually or import a dataset.</p>
             </div>
          )}
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
                            <input 
                                list={`category-options-${factor.id}`}
                                value={editValues.category || ''}
                                onChange={e => setEditValues({...editValues, category: e.target.value})}
                                className="w-full p-1.5 text-sm rounded border border-slate-300 outline-none"
                                placeholder="Category"
                            />
                            <datalist id={`category-options-${factor.id}`}>
                                {availableCategories.map(cat => <option key={cat} value={cat} />)}
                            </datalist>
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
                  <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold border ${catColor}`}>
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
          disabled={factors.length < 2}
          className={`px-8 py-3 font-bold rounded-lg shadow-lg transition-all transform ${factors.length < 2 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 hover:scale-[1.02]'}`}
        >
          Next: Build SSIM Matrix
        </button>
      </div>
    </div>
  );
};

export default FactorInput;