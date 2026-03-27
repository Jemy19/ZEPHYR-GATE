import React, { useState, useEffect } from 'react';
import { JiraTicket, TestCase, TestStep } from '../types/index';
import { Template } from '../types/index';
import { publishToZephyr } from '../services/mockService';
import { interpolate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  List, 
  Settings, 
  Play, 
  Copy, 
  ExternalLink,
  Layout,
  Code,
  Sparkles,
  Upload
} from 'lucide-react';

const Gatekeeper = ({ 
  jiraTicket, 
  initialTestCases, 
  templates,
  onReset,
  onUpdateHistory,
  initialZephyrKeys = [],
  isHistoryView = false
}: { 
  jiraTicket: JiraTicket; 
  initialTestCases: TestCase[]; 
  templates: Template[];
  onReset: () => void; 
  onUpdateHistory: (cases: TestCase[], keys: string[]) => void;
  initialZephyrKeys?: string[];
  isHistoryView?: boolean;
}) => {
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'review' | 'success'>(initialZephyrKeys.length > 0 ? 'success' : 'review');
  const [isMerging, setIsMerging] = useState(false);
  const [zephyrKeys, setZephyrKeys] = useState<string[]>(initialZephyrKeys);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Section visibility states
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Track parameters separate from test cases to drive the effect
  const [parameters, setParameters] = useState<Record<string, string>>(initialTestCases[0]?.parameters || {});

  const templateId = testCases[0]?.templateId;
  const templateName = templates.find(t => t.id === templateId)?.name || 'Custom Template';

  // Re-merge if parameters change
  useEffect(() => {
    if (testCases.length > 0) {
      setTestCases(prevTestCases => {
          return prevTestCases.map(tc => {
              const newSteps = tc.steps.map(s => ({
                  ...s,
                  step: s.rawStep ? interpolate(s.rawStep, parameters) : s.step,
                  data: s.rawData ? interpolate(s.rawData, parameters) : s.data,
                  expectedResult: s.rawExpectedResult ? interpolate(s.rawExpectedResult, parameters) : s.expectedResult,
                  sqlScript: s.rawSqlScript ? interpolate(s.rawSqlScript, parameters) : s.sqlScript,
              }));

              return {
                  ...tc,
                  title: tc.rawTitle ? interpolate(tc.rawTitle, parameters) : tc.title,
                  objective: tc.rawObjective ? interpolate(tc.rawObjective, parameters) : tc.objective,
                  preconditions: tc.rawPreconditions ? interpolate(tc.rawPreconditions, parameters) : tc.preconditions,
                  steps: newSteps,
                  parameters: parameters
              };
          });
      });
    }
  }, [parameters]); 

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    onUpdateHistory(testCases, zephyrKeys);
    setTimeout(() => setIsSavingDraft(false), 1000);
  };

  const handleMerge = async () => {
    setIsMerging(true);
    const newKeys = await publishToZephyr(testCases, jiraTicket.key);
    setZephyrKeys(newKeys);
    onUpdateHistory(testCases, newKeys);
    setIsMerging(false);
    setActiveTab('success');
  };

  const handleParamChange = (key: string, value: string) => {
     setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddTestCase = () => {
    const newCase: TestCase = {
      id: `manual-case-${Date.now()}`,
      title: "New Test Case",
      objective: "",
      preconditions: "",
      steps: [],
      source: 'MANUAL',
      labels: [],
      status: "Draft",
      priority: "Normal",
      component: "None",
      owner: "Unassigned",
      estimatedTime: "00:05",
      folder: "None",
      parameters: parameters
    };
    const newCases = [...testCases, newCase];
    setTestCases(newCases);
    setActiveIndex(newCases.length - 1);
  };

  const handleDeleteTestCase = (indexToDelete: number) => {
    if (testCases.length <= 1) {
        alert("You must have at least one test case.");
        return;
    }
    const newCases = testCases.filter((_, i) => i !== indexToDelete);
    setTestCases(newCases);
    if (activeIndex === indexToDelete) {
        const maxIndex = newCases.length - 1;
        setActiveIndex(Math.min(activeIndex, maxIndex));
    } else if (activeIndex > indexToDelete) {
        setActiveIndex(activeIndex - 1);
    }
  };

  const handleStepChange = (stepIdx: number, field: keyof TestStep, value: string) => {
    const newCases = [...testCases];
    const newSteps = [...newCases[activeIndex].steps];
    
    const updatedStep = { ...newSteps[stepIdx], [field]: value };
    if (field === 'step') delete updatedStep.rawStep;
    if (field === 'data') delete updatedStep.rawData;
    if (field === 'expectedResult') delete updatedStep.rawExpectedResult;
    if (field === 'sqlScript') delete updatedStep.rawSqlScript;

    newSteps[stepIdx] = updatedStep;
    newCases[activeIndex] = { ...newCases[activeIndex], steps: newSteps };
    setTestCases(newCases);
  };

  const handleAddStep = () => {
    const newCases = [...testCases];
    const newStep: TestStep = {
        id: `manual-${Date.now()}`,
        step: "",
        data: "",
        expectedResult: "",
        sqlScript: ""
    };
    newCases[activeIndex] = {
        ...newCases[activeIndex],
        steps: [...newCases[activeIndex].steps, newStep]
    };
    setTestCases(newCases);
  };

  const handleDeleteStep = (stepIdx: number) => {
    const newCases = [...testCases];
    const newSteps = newCases[activeIndex].steps.filter((_, i) => i !== stepIdx);
    newCases[activeIndex] = { ...newCases[activeIndex], steps: newSteps };
    setTestCases(newCases);
  };

  const updateCaseField = (field: keyof TestCase, value: any) => {
    const newCases = [...testCases];
    newCases[activeIndex] = { ...newCases[activeIndex], [field]: value };
    if (field === 'title') delete newCases[activeIndex].rawTitle;
    if (field === 'objective') delete newCases[activeIndex].rawObjective;
    if (field === 'preconditions') delete newCases[activeIndex].rawPreconditions;
    setTestCases(newCases);
  };
  
  const currentCase = testCases[activeIndex];

  const generateAiPrompt = () => {
    let prompt = "Generate automated test scripts for the following Zephyr Scale Test Cases:\n\n";
    testCases.forEach((tc, index) => {
      const key = zephyrKeys[index] || 'PENDING';
      prompt += `Test Case: ${key} - ${tc.title}\n`;
      prompt += `Objective: ${tc.objective}\n`;
      prompt += `Preconditions: ${tc.preconditions}\n`;
      prompt += `Steps:\n`;
      tc.steps.forEach((step, sIdx) => {
         prompt += `${sIdx + 1}. Action: ${step.step}\n`;
         prompt += `   Data: ${step.data}\n`;
         prompt += `   Expected: ${step.expectedResult}\n`;
         if (step.sqlScript) {
            prompt += `   SQL/Script: ${step.sqlScript}\n`;
         }
      });
      prompt += `\n--------------------------------------------------\n\n`;
    });
    return prompt;
  };

  const copyPromptToClipboard = () => {
      const prompt = generateAiPrompt();
      navigator.clipboard.writeText(prompt);
      alert("Prompt copied to clipboard!");
  };

  if (activeTab === 'success') {
    const aiPrompt = generateAiPrompt();

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm animate-in fade-in duration-300" />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full max-w-5xl bg-surface border border-border rounded-2xl shadow-2xl p-8 flex flex-col max-h-[90vh]"
        >
           <button 
               onClick={onReset}
               className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors z-20"
           >
               <X className="w-5 h-5" />
           </button>
           <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Synced to Zephyr</h2>
                <p className="text-muted-foreground text-sm">Successfully created {zephyrKeys.length} test cases linked to {jiraTicket.key}</p>
              </div>
           </div>
          
          <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
              {/* Left Column: Test Cases List */}
              <div className="flex flex-col min-h-0">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <List className="w-4 h-4" /> Created Cases
                  </h3>
                  <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {zephyrKeys.map((key, i) => (
                        <a 
                        key={key} 
                        href="#" 
                        className="flex items-center justify-between bg-background/50 hover:bg-background border border-border hover:border-emerald-500/30 rounded-lg p-4 transition-all group"
                        onClick={(e) => { e.preventDefault(); alert(`Opening Zephyr Scale for ${key}`); }}
                        >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-500 font-mono font-bold text-xs">
                                {key}
                            </div>
                            <div className="overflow-hidden">
                                <div className="font-medium text-white truncate">{testCases[i]?.title}</div>
                                <div className="text-xs text-muted-foreground truncate">Linked to {jiraTicket.key}</div>
                            </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                        </a>
                    ))}
                  </div>
              </div>

              {/* Right Column: AI Prompt */}
              <div className="flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Code className="w-4 h-4" /> Automation Prompt
                      </h3>
                      <button 
                        onClick={copyPromptToClipboard}
                        className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 font-medium bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                      >
                          <Copy className="w-3 h-3" /> Copy
                      </button>
                  </div>
                  <div className="flex-1 bg-background border border-border rounded-lg p-4 overflow-hidden relative group">
                      <textarea 
                        readOnly
                        className="w-full h-full bg-transparent text-xs font-mono text-muted-foreground resize-none focus:outline-none custom-scrollbar"
                        value={aiPrompt}
                      />
                  </div>
              </div>
          </div>

          {!isHistoryView && (
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
                <button 
                    onClick={onReset} 
                    className="btn-secondary"
                >
                    Process Another Ticket
                </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Modals */}
      <AnimatePresence>
        {showCancelModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-2">Unsaved Changes</h3>
                    <p className="text-muted-foreground text-sm mb-6">You have unsaved changes. Do you want to save this session to your history before leaving?</p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => {
                                handleSaveDraft();
                                setShowCancelModal(false);
                                onReset();
                            }} 
                            className="btn-primary w-full justify-center"
                        >
                            Save to Drafts & Exit
                        </button>
                        <button 
                            onClick={onReset} 
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                        >
                            Discard & Exit
                        </button>
                        <button 
                            onClick={() => setShowCancelModal(false)} 
                            className="btn-ghost text-sm w-full"
                        >
                            Keep Editing
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
        {deleteTargetIndex !== null && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteTargetIndex(null)} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-2">Delete Test Case?</h3>
                    <p className="text-muted-foreground text-sm mb-6">Are you sure you want to delete this test case?</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setDeleteTargetIndex(null)} className="btn-ghost text-sm">Cancel</button>
                        <button onClick={() => { handleDeleteTestCase(deleteTargetIndex); setDeleteTargetIndex(null); }} className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Yes, Delete</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowCancelModal(true)} className="mr-2 p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
             <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-jira/10 border border-jira/20 rounded text-jira font-mono font-bold text-sm">
                {jiraTicket.key}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-white">Review & Parameterize</span>
            {templateId && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded text-sm">
                  <span className="text-muted-foreground">Template:</span>
                  <span className="text-white font-medium">{templateName}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={handleMerge} disabled={isMerging} className="btn-primary">
            {isMerging ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> : <Upload className="w-4 h-4" />}
            {isMerging ? 'Committing...' : `Merge ${testCases.length} Cases`}
            </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Jira (Collapsible?) */}
        <div className="flex flex-col border-r border-border bg-background w-[320px] shrink-0">
          <div className="p-4 border-b border-border bg-surface/30 sticky top-0 backdrop-blur-sm z-10 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <Layout className="w-4 h-4 text-muted-foreground" /> Requirements
            </h3>
          </div>
          <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar">
            <div>
              <p className="text-lg font-medium text-white leading-snug">{jiraTicket.summary}</p>
              <div className="flex items-center gap-2 mt-2">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded border uppercase font-bold", 
                      jiraTicket.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      jiraTicket.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  )}>{jiraTicket.priority}</span>
                  <span className="text-xs text-muted-foreground">Reporter: {jiraTicket.reporter}</span>
              </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <div className="text-slate-300 text-sm whitespace-pre-wrap bg-surface border border-border p-3 rounded-lg">
                    {jiraTicket.description}
                </div>
            </div>

             <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acceptance Criteria</label>
                <div className="text-slate-300 text-sm whitespace-pre-wrap bg-surface border border-border p-3 rounded-lg">
                    {jiraTicket.acceptanceCriteria}
                </div>
            </div>
          </div>
        </div>

        {/* Middle: Test Case Editor */}
        <div className="flex-1 flex flex-col bg-surface/30 relative z-0 border-r border-border min-w-[500px]">
           {/* Top Tabs (Case Switching) */}
           <div className="px-2 pt-2 border-b border-border flex items-end gap-1 bg-background overflow-x-auto custom-scrollbar">
               {testCases.map((tc, idx) => (
                  <div
                    key={tc.id}
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                        "group flex items-center justify-between gap-2 min-w-[160px] max-w-[240px] flex-shrink-0 h-10 px-4 rounded-t-lg border-t border-x text-xs font-medium cursor-pointer select-none transition-all relative",
                        activeIndex === idx 
                        ? 'bg-surface/30 text-white border-border border-b-transparent z-10' 
                        : 'bg-surface/10 text-muted-foreground border-transparent hover:bg-surface/20 hover:text-slate-300 mt-1 h-9'
                    )}
                  >
                    <span className="truncate flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 opacity-70" />
                        {tc.title || 'Untitled'}
                    </span>
                    {testCases.length > 1 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteTargetIndex(idx); }} 
                            className={cn(
                                "p-1 rounded-md hover:bg-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all",
                                activeIndex === idx && "opacity-100"
                            )}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                  </div>
               ))}
               <button 
                onClick={handleAddTestCase} 
                className="flex-none w-9 h-9 flex items-center justify-center rounded-t-lg text-muted-foreground hover:text-primary hover:bg-surface/20 transition-colors"
                title="Add Test Case"
               >
                    <Plus className="w-4 h-4" />
                </button>
           </div>

           {/* Editor Content */}
           <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              {currentCase ? (
                <div className="max-w-4xl mx-auto space-y-8 pb-20">
                   
                   {/* 1. Description Section */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> Test Case Details
                         </h3>
                      </div>
                      
                      <div className="glass-panel rounded-xl p-6 space-y-5">
                            <div>
                               <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Title <span className="text-destructive">*</span></label>
                               <input 
                                  className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-2 text-lg text-white font-medium placeholder:text-muted-foreground/30" 
                                  value={currentCase.title}
                                  onChange={(e) => updateCaseField('title', e.target.value)}
                                  placeholder="Enter test case title..."
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Objective</label>
                                    <textarea 
                                        className="w-full bg-background/50 border border-border rounded-lg p-3 text-sm text-slate-200 focus:border-primary outline-none min-h-[100px] resize-none" 
                                        value={currentCase.objective}
                                        onChange={(e) => updateCaseField('objective', e.target.value)}
                                        placeholder="What is the goal of this test?"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Preconditions</label>
                                    <textarea 
                                        className="w-full bg-background/50 border border-border rounded-lg p-3 text-sm text-slate-200 focus:border-primary outline-none min-h-[100px] resize-none" 
                                        value={currentCase.preconditions}
                                        onChange={(e) => updateCaseField('preconditions', e.target.value)}
                                        placeholder="Prerequisites..."
                                    />
                                </div>
                            </div>
                      </div>
                   </div>

                   {/* 2. Metadata Grid */}
                   <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" /> Metadata
                        </h3>
                        <div className="glass-panel rounded-xl p-6 grid grid-cols-4 gap-6">
                             {/* Row 1 */}
                             <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status</label>
                                <select 
                                    className="input-base"
                                    value={currentCase.status}
                                    onChange={(e) => updateCaseField('status', e.target.value)}
                                >
                                    <option>Draft</option>
                                    <option>Approved</option>
                                    <option>Deprecated</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Priority</label>
                                <select 
                                    className="input-base"
                                    value={currentCase.priority}
                                    onChange={(e) => updateCaseField('priority', e.target.value)}
                                >
                                    <option>Normal</option>
                                    <option>High</option>
                                    <option>Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Component</label>
                                <input 
                                    className="input-base"
                                    value={currentCase.component}
                                    onChange={(e) => updateCaseField('component', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Owner</label>
                                <input 
                                    className="input-base"
                                    value={currentCase.owner}
                                    onChange={(e) => updateCaseField('owner', e.target.value)}
                                />
                            </div>

                            {/* Row 2 */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Estimated Time</label>
                                <input 
                                    className="input-base"
                                    value={currentCase.estimatedTime}
                                    onChange={(e) => updateCaseField('estimatedTime', e.target.value)}
                                    placeholder="00:00"
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Labels</label>
                                <div className="flex flex-wrap gap-2 items-center min-h-[38px] bg-surface border border-border rounded-lg px-3 py-1">
                                    {currentCase.labels?.map((label, idx) => (
                                        <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                            {label}
                                            <button 
                                                onClick={() => {
                                                    const newLabels = currentCase.labels.filter((_, i) => i !== idx);
                                                    updateCaseField('labels', newLabels);
                                                }}
                                                className="hover:text-white ml-1"
                                            ><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                    <input 
                                        placeholder="+ Add Label" 
                                        className="bg-transparent text-sm min-w-[80px] text-white focus:outline-none placeholder:text-muted-foreground/50"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.currentTarget.value.trim();
                                                if (val && !currentCase.labels.includes(val)) {
                                                    updateCaseField('labels', [...currentCase.labels, val]);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                   </div>

                   {/* 3. Test Script Section */}
                   <div>
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <List className="w-5 h-5 text-primary" /> Test Script
                         </h3>
                         <button 
                            onClick={handleAddStep}
                            className="btn-secondary text-xs py-1.5"
                         >
                            <Plus className="w-4 h-4" /> Add Step
                         </button>
                      </div>
                      <div className="space-y-4">
                         {currentCase.steps.map((step, idx) => (
                            <div key={idx} className="bg-surface border border-border rounded-xl p-5 group hover:border-slate-600 transition-all shadow-sm">
                               <div className="flex gap-5">
                                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground font-mono text-xs shrink-0 mt-1">
                                     {idx+1}
                                  </div>
                                  <div className="flex-1 space-y-4">
                                     <textarea
                                        placeholder="Action / Step Description"
                                        className="w-full bg-transparent border-b border-border focus:border-primary outline-none text-sm text-white resize-none placeholder:text-muted-foreground/40"
                                        rows={2}
                                        value={step.step}
                                        onChange={(e) => handleStepChange(idx, 'step', e.target.value)}
                                     />
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-background/50 p-3 rounded-lg border border-border">
                                            <span className="text-muted-foreground block text-[10px] uppercase mb-1 font-bold tracking-wider">Test Data</span>
                                            <input 
                                                className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm text-slate-200 placeholder:text-muted-foreground/30 p-0"
                                                value={step.data}
                                                onChange={(e) => handleStepChange(idx, 'data', e.target.value)}
                                                placeholder="Input data..."
                                            />
                                        </div>
                                        <div className="bg-background/50 p-3 rounded-lg border border-border">
                                            <span className="text-muted-foreground block text-[10px] uppercase mb-1 font-bold tracking-wider">Expected Result</span>
                                            <input 
                                                className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm text-slate-200 placeholder:text-muted-foreground/30 p-0"
                                                value={step.expectedResult}
                                                onChange={(e) => handleStepChange(idx, 'expectedResult', e.target.value)}
                                                placeholder="Expected outcome..."
                                            />
                                        </div>
                                     </div>
                                     <div className="bg-slate-950 p-3 rounded-lg border border-border/50 font-mono text-xs">
                                         <span className="text-blue-400 block text-[10px] uppercase mb-1 font-bold flex items-center gap-1">
                                            <Code className="w-3 h-3" /> SQL / Automation Script
                                         </span>
                                         <textarea
                                            className="w-full bg-transparent outline-none text-slate-400 resize-none font-mono placeholder:text-slate-700"
                                            rows={2}
                                            value={step.sqlScript || ''}
                                            placeholder="-- SQL or Code snippet here"
                                            onChange={(e) => handleStepChange(idx, 'sqlScript', e.target.value)}
                                         />
                                     </div>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteStep(idx)}
                                    className="text-muted-foreground hover:text-destructive self-start p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/10"
                                    title="Delete Step"
                                  >
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                         ))}
                         <button 
                            onClick={handleAddStep}
                            className="w-full py-4 border border-dashed border-border text-muted-foreground rounded-xl hover:border-primary hover:text-primary transition-all text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
                         >
                            <Plus className="w-4 h-4" />
                            Add Test Step
                         </button>
                      </div>
                   </div>

                </div>
              ) : (
                <div className="text-muted-foreground text-center mt-20 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center">
                        <FileText className="w-8 h-8 opacity-20" />
                    </div>
                    <p>No active test case selected.</p>
                </div>
              )}
           </div>
        </div>

        {/* Right: Parameter Editor */}
        <div className="w-80 bg-background flex flex-col border-l border-border shrink-0">
          <div className="p-4 border-b border-border bg-surface/30 sticky top-0 backdrop-blur-sm">
             <h3 className="font-semibold text-warning flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" /> Extracted Parameters
             </h3>
          </div>
          <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
             <div className="text-xs text-muted-foreground bg-surface border border-border p-3 rounded-lg leading-relaxed">
                Gemini extracted these values from the Jira ticket. Editing them will instantly update ALL test cases.
             </div>
             {Object.keys(parameters).length > 0 ? (
               Object.entries(parameters).map(([key, val]) => (
                  <div key={key} className="space-y-1.5 group">
                     <label className="text-xs font-mono text-slate-500 flex justify-between group-hover:text-primary transition-colors">
                        <span>{`{{${key}}}`}</span>
                     </label>
                     <textarea 
                        rows={2}
                        className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-white focus:border-warning outline-none transition-all resize-none"
                        value={val}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                     />
                  </div>
               ))
             ) : (
                <div className="p-8 border border-dashed border-border rounded-lg text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                        <X className="w-4 h-4 opacity-50" />
                   </div>
                   No variables defined in this template.
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Re-declare Sparkles here since it was used in Harvester but not imported in the original file
// Actually I imported it at the top.

export default Gatekeeper;
