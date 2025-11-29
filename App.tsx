import React, { useState, useEffect } from 'react';
import { AppStep, ISMElement, SSIMData, ISMResult } from './types';
import FactorInput from './components/FactorInput';
import SSIMGrid from './components/SSIMGrid';
import ResultsView from './components/ResultsView';
import { runISMAnalysis } from './services/ismLogic';
import { HardHat, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

// Default factors based on the Sustainability Barriers input
const DEFAULT_FACTORS: ISMElement[] = [
  { id: 'F1', name: 'F1', description: 'Lack of commitment from top management', category: 'Management' },
  { id: 'F2', name: 'F2', description: 'Financial Constraints', category: 'Cost' },
  { id: 'F3', name: 'F3', description: 'Organizational culture inhibitive to sustainability/CSR', category: 'Organization' },
  { id: 'F4', name: 'F4', description: 'Lack of new technology/materials and processes on sustainability', category: 'Technology' },
  { id: 'F5', name: 'F5', description: 'Lack of awareness of benefits of sustainability', category: 'Knowledge' },
  { id: 'F6', name: 'F6', description: 'Lack of green purchasing', category: 'Process' },
  { id: 'F7', name: 'F7', description: 'Lack of regulations and enforcement of environment standards', category: 'Policy' },
  { id: 'F8', name: 'F8', description: 'Lack of R&D on sustainability', category: 'Technology' },
  { id: 'F9', name: 'F9', description: 'Lack of training/human expertise on sustainability', category: 'Knowledge' },
  { id: 'F10', name: 'F10', description: 'Resistance to change and adopting innovation in sustainability', category: 'Organization' },
  { id: 'F11', name: 'F11', description: 'Lack of performance metrics/evaluation standards on sustainability', category: 'Process' },
];

const FIXED_TOPIC = "Barriers to Sustainability Implementation";

const App: React.FC = () => {
  // Initialize directly to Factor Definition step with default data
  const [step, setStep] = useState<AppStep>(AppStep.DEFINE_FACTORS);
  const [topic] = useState(FIXED_TOPIC);
  const [factors, setFactors] = useState<ISMElement[]>(DEFAULT_FACTORS);
  const [ssim, setSsim] = useState<SSIMData>({});
  const [result, setResult] = useState<ISMResult | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const goToSSIM = () => {
    if (factors.length < 2) {
      alert("Please define at least 2 factors to proceed.");
      return;
    }
    setStep(AppStep.FILL_SSIM);
  };

  const calculateAndShowResults = () => {
    const factorIds = factors.map(f => f.id);
    const analysis = runISMAnalysis(factors.length, factorIds, ssim);
    setResult(analysis);
    setStep(AppStep.ANALYSIS_RESULT);
  };

  const resetAnalysis = () => {
    if(window.confirm("This will clear the current analysis and SSIM data. The factors will remain. Continue?")) {
      setSsim({});
      setResult(null);
      setStep(AppStep.DEFINE_FACTORS);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 selection:bg-emerald-500/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-md shadow-emerald-200">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-emerald-800 hidden md:block whitespace-nowrap">
              ISM Tool
            </h1>
            <span className="text-emerald-200 hidden md:block">|</span>
            <p className="text-xs md:text-sm lg:text-base font-semibold text-emerald-900 truncate max-w-[200px] md:max-w-none">
                SSIM & MICMAC Analysis (Trial Version)
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className={step === AppStep.DEFINE_FACTORS ? 'text-emerald-700 font-bold' : ''}>1. Factors</span>
            <span>&rarr;</span>
            <span className={step === AppStep.FILL_SSIM ? 'text-emerald-700 font-bold' : ''}>2. Relations</span>
            <span>&rarr;</span>
            <span className={step === AppStep.ANALYSIS_RESULT ? 'text-emerald-700 font-bold' : ''}>3. Model</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 print:p-0 flex-grow w-full">
        
        {step === AppStep.DEFINE_FACTORS && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
             
             {/* User Manual / Instructions */}
             <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
                <div 
                    className="p-4 bg-emerald-50/50 flex items-center justify-between cursor-pointer border-b border-emerald-50 hover:bg-emerald-50 transition-colors"
                    onClick={() => setIsManualOpen(!isManualOpen)}
                >
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                        <BookOpen className="w-5 h-5" />
                        <h2>User Manual & Instructions</h2>
                    </div>
                    {isManualOpen ? <ChevronUp className="w-5 h-5 text-emerald-700" /> : <ChevronDown className="w-5 h-5 text-emerald-700" />}
                </div>
                
                {isManualOpen && (
                    <div className="p-6 space-y-6 text-slate-700 text-sm leading-relaxed">
                        <p className="text-base">
                            Welcome to the ISM Tool. This platform guides you through the process of Interpretive Structural Modelling (ISM) to analyze complex relationships between various factors.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <h3 className="font-bold text-emerald-800 uppercase text-lg tracking-wider">Step 1: Define Factors</h3>
                                <p>
                                    Input the critical factors for your study. You can add them manually, or for large datasets, use the 
                                    <strong> Import</strong> feature.
                                </p>
                                <ul className="list-disc list-inside text-xs text-slate-500 space-y-1 ml-1">
                                    <li>Use the <strong>Template</strong> button to download a formatted CSV file.</li>
                                    <li>Fill in your factors (ID, Name, Description, Category) and upload it back using <strong>Import</strong>.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-emerald-800 uppercase text-lg tracking-wider">Step 2: Build SSIM</h3>
                                <p>
                                    Establish the contextual relationships between factors in the Structural Self-Interaction Matrix (SSIM).
                                </p>
                                <ul className="list-none text-xs text-slate-500 space-y-1">
                                    <li><span className="font-bold text-emerald-600">V</span>: Factor <i>i</i> influences <i>j</i></li>
                                    <li><span className="font-bold text-amber-600">A</span>: Factor <i>j</i> influences <i>i</i></li>
                                    <li><span className="font-bold text-blue-600">X</span>: Mutual influence (<i>i</i> &harr; <i>j</i>)</li>
                                    <li><span className="font-bold text-slate-400">O</span>: No relationship</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-emerald-800 uppercase text-lg tracking-wider">Step 3: Analyze Model</h3>
                                <p>
                                    The tool automatically calculates the Reachability Matrix, checks for Transitivity, partitions levels, and generates:
                                </p>
                                <ul className="list-disc list-inside text-xs text-slate-500 space-y-1 ml-1">
                                    <li><strong>Hierarchy Graph</strong>: A multi-level structural model.</li>
                                    <li><strong>MICMAC Analysis</strong>: Driving vs. Dependence power quadrant chart.</li>
                                    <li><strong>Interrelationship Digraph</strong>: Network visualization of connections.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
             </div>

             <FactorInput 
                factors={factors} 
                setFactors={setFactors} 
                topic={topic} 
                onNext={goToSSIM} 
              />
          </div>
        )}

        {step === AppStep.FILL_SSIM && (
          <SSIMGrid 
            factors={factors} 
            ssim={ssim} 
            setSsim={setSsim} 
            topic={topic}
            onNext={calculateAndShowResults}
            onBack={() => setStep(AppStep.DEFINE_FACTORS)}
          />
        )}

        {step === AppStep.ANALYSIS_RESULT && result && (
          <ResultsView 
            factors={factors} 
            result={result} 
            onReset={resetAnalysis}
            onBack={goToSSIM}
          />
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="w-full border-t border-slate-200 bg-white py-6 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs text-slate-400">
                Disclaimer: This Web App is made by Atlas Cheung with the help of Google AI Studio for academic use only. This application collects no personal information.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;