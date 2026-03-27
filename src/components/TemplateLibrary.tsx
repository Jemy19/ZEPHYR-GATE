import React, { useState } from 'react';
import { Template, TestCase } from '../types/index';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  LayoutGrid, 
  Settings, 
  Search,
  Tag,
  Folder,
  Clock,
  User,
  MoreVertical,
  Edit3,
  List
} from 'lucide-react';
import { cn } from '../lib/utils';

const TemplateLibrary = ({ 
  templates, 
  onClose,
  onSave,
  onDelete
}: { 
  templates: Template[], 
  onClose: () => void,
  onSave: (tpl: Template) => void,
  onDelete: (id: string) => void
}) => {
  const [selectedTpl, setSelectedTpl] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Simplified edit state
  const [editForm, setEditForm] = useState<Template | null>(null);
  
  // Delete modal state
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const handleEdit = (tpl: Template) => {
    setSelectedTpl(tpl);
    setEditForm(JSON.parse(JSON.stringify(tpl))); // Deep copy
    setIsEditing(true);
    setActiveCaseIndex(0);
  };

  const handleSave = () => {
    if (editForm) {
      onSave(editForm);
      setIsEditing(false);
      setSelectedTpl(editForm);
    }
  };

  const confirmDelete = () => {
    if (deleteTemplateId) {
        onDelete(deleteTemplateId);
        if (selectedTpl?.id === deleteTemplateId) {
            setSelectedTpl(null);
            setEditForm(null);
            setIsEditing(false);
        }
        setDeleteTemplateId(null);
    }
  };

  const updateTemplateCaseField = (field: keyof TestCase, value: any) => {
    if (!editForm) return;
    const newCases = [...editForm.testCases];
    newCases[activeCaseIndex] = { ...newCases[activeCaseIndex], [field]: value };
    setEditForm({...editForm, testCases: newCases});
  };

  const currentCase = editForm?.testCases[activeCaseIndex];

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-background animate-fade-in relative">
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTemplateId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteTemplateId(null)} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-destructive" />
                        Delete Template?
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                        Are you sure you want to delete <span className="text-white font-medium">"{templates.find(t => t.id === deleteTemplateId)?.name}"</span>?
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setDeleteTemplateId(null)} className="btn-ghost text-sm">Cancel</button>
                        <button onClick={confirmDelete} className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Yes, Delete</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-primary" />
          Template Library
        </h2>
        <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                    placeholder="Search templates..." 
                    className="bg-surface border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:border-primary outline-none w-64 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button onClick={onClose} className="btn-ghost text-sm">
            Close
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-border bg-background overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <button 
             className="w-full py-4 border border-dashed border-border text-muted-foreground rounded-xl hover:border-primary hover:text-primary transition-all mb-4 text-sm font-medium flex items-center justify-center gap-2 group"
             onClick={() => {
                const newTpl: Template = {
                   id: `tpl-new-${Date.now()}`,
                   name: "New Template",
                   category: "General",
                   description: "Description...",
                   variables: ["var_1"],
                   testCases: [{ 
                       title: "Test {{var_1}}", 
                       objective: "", 
                       preconditions: "", 
                       steps: [], 
                       labels: [],
                       status: "Draft",
                       priority: "Normal",
                       component: "None",
                       owner: "Unassigned",
                       estimatedTime: "00:05",
                       folder: "None"
                    }]
                };
                handleEdit(newTpl);
             }}
          >
            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                <Plus className="w-4 h-4" />
            </div>
            Create New Template
          </button>
          
          <div className="space-y-3">
              {filteredTemplates.map(tpl => (
                <div 
                key={tpl.id} 
                onClick={() => handleEdit(tpl)}
                className={cn(
                    "group relative p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg",
                    selectedTpl?.id === tpl.id 
                    ? 'bg-surface border-primary shadow-md' 
                    : 'bg-surface/30 border-border hover:border-slate-600 hover:bg-surface/50'
                )}
                >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-medium truncate pr-6">{tpl.name}</h3>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTemplateId(tpl.id);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Template"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 h-8">{tpl.description}</p>
                <div className="flex gap-2 items-center">
                    <span className="text-[10px] bg-surface border border-border px-2 py-0.5 rounded-full text-slate-400 font-medium uppercase tracking-wide">{tpl.category}</span>
                    <div className="flex gap-1 ml-auto">
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                            <Settings className="w-3 h-3" /> {tpl.variables.length}
                        </span>
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {tpl.testCases.length}
                        </span>
                    </div>
                </div>
                </div>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-surface/30 p-8 overflow-y-auto custom-scrollbar relative">
          {isEditing && editForm ? (
            <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Template Meta */}
              <div className="glass-panel rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Edit3 className="w-5 h-5 text-primary" /> Template Details
                      </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-1 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Template Name</label>
                            <input 
                            className="input-base text-lg font-medium" 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Category</label>
                            <input 
                            className="input-base" 
                            value={editForm.category} 
                            onChange={e => setEditForm({...editForm, category: e.target.value})} 
                            />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Description</label>
                        <textarea 
                            className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-white focus:border-primary outline-none h-[108px] resize-none" 
                            value={editForm.description} 
                            onChange={e => setEditForm({...editForm, description: e.target.value})} 
                        />
                      </div>
                  </div>

                  {/* Variables */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Variables (for AI Extraction)</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-background/50 border border-border rounded-xl">
                        {editForm.variables.map((v, i) => (
                            <span key={i} className="bg-warning/10 text-warning px-3 py-1.5 rounded-lg text-sm font-mono flex items-center gap-2 border border-warning/20 shadow-sm group">
                            <span>{`{{${v}}}`}</span>
                            <button 
                                onClick={() => setEditForm({...editForm, variables: editForm.variables.filter((_, idx) => idx !== i)})}
                                className="hover:text-white hover:bg-warning/20 rounded px-1 transition-colors opacity-50 group-hover:opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            </span>
                        ))}
                        <div className="relative flex items-center">
                            <Plus className="w-3 h-3 text-muted-foreground absolute left-2" />
                            <input 
                                placeholder="Add variable..." 
                                className="bg-transparent border-b border-border text-sm w-32 text-white focus:outline-none focus:border-warning pl-7 py-1 placeholder:text-muted-foreground/50"
                                onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value.trim();
                                    if (val && !editForm.variables.includes(val)) {
                                    setEditForm({...editForm, variables: [...editForm.variables, val]});
                                    e.currentTarget.value = '';
                                    }
                                }
                                }}
                            />
                        </div>
                    </div>
                  </div>
              </div>

              {/* Test Cases Definition */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Test Cases
                    </h3>
                    <button 
                        onClick={() => {
                            const newCase = { 
                                title: "New Case", 
                                objective: "", 
                                preconditions: "", 
                                steps: [], 
                                labels: [],
                                status: "Draft",
                                priority: "Normal",
                                component: "None",
                                owner: "Unassigned",
                                estimatedTime: "00:05",
                                folder: "None"
                            };
                            const newCases = [...editForm.testCases, newCase];
                            setEditForm({...editForm, testCases: newCases});
                            setActiveCaseIndex(newCases.length - 1);
                        }}
                        className="btn-secondary text-xs py-1.5"
                    >
                        <Plus className="w-4 h-4" /> Add Case
                    </button>
                 </div>

                 {/* Tab Bar */}
                 <div className="flex gap-1 border-b border-border overflow-x-auto custom-scrollbar">
                    {editForm.testCases.map((tc, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCaseIndex(idx)}
                        className={cn(
                            "px-5 py-2.5 text-sm font-medium transition-colors border-t border-x rounded-t-lg relative top-[1px] min-w-[120px] flex items-center justify-center gap-2",
                            activeCaseIndex === idx 
                            ? 'bg-surface border-border text-white border-b-surface z-10' 
                            : 'bg-transparent border-transparent text-muted-foreground hover:text-slate-300 hover:bg-surface/10'
                        )}
                      >
                        {tc.title || `Case ${idx + 1}`}
                        {editForm.testCases.length > 1 && activeCaseIndex === idx && (
                             <X 
                                className="w-3 h-3 text-muted-foreground hover:text-destructive ml-1" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newCases = editForm.testCases.filter((_, i) => i !== idx);
                                    setEditForm({...editForm, testCases: newCases});
                                    setActiveCaseIndex(Math.max(0, activeCaseIndex - 1));
                                }}
                             />
                        )}
                      </button>
                   ))}
                 </div>

                 {/* Case Editor Card */}
                 {currentCase && (
                    <div className="glass-panel rounded-b-xl rounded-tr-xl p-8 space-y-8 animate-in fade-in duration-200">
                        
                        {/* Case Details */}
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Case Title</label>
                                    <input 
                                        className="input-base" 
                                        value={currentCase.title} 
                                        onChange={e => updateTemplateCaseField('title', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Objective</label>
                                    <textarea 
                                        className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-white focus:border-primary outline-none h-24 resize-none" 
                                        value={currentCase.objective} 
                                        onChange={e => updateTemplateCaseField('objective', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Priority</label>
                                        <select 
                                            className="input-base"
                                            value={currentCase.priority}
                                            onChange={e => updateTemplateCaseField('priority', e.target.value)}
                                        >
                                            <option>Normal</option>
                                            <option>High</option>
                                            <option>Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Time</label>
                                        <input 
                                            className="input-base"
                                            value={currentCase.estimatedTime}
                                            onChange={e => updateTemplateCaseField('estimatedTime', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Preconditions</label>
                                    <textarea 
                                        className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-white focus:border-primary outline-none h-24 resize-none" 
                                        value={currentCase.preconditions} 
                                        onChange={e => updateTemplateCaseField('preconditions', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="border-t border-border pt-6">
                             <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <List className="w-4 h-4 text-primary" /> Test Steps
                                </h4>
                             </div>
                             
                             <div className="space-y-4">
                                {currentCase.steps.map((step, idx) => (
                                    <div key={idx} className="bg-background/50 border border-border rounded-xl p-4 group hover:border-slate-600 transition-colors relative">
                                        <div className="absolute top-4 left-4 w-6 h-6 rounded bg-surface border border-border flex items-center justify-center text-xs font-mono text-muted-foreground">
                                            {idx + 1}
                                        </div>
                                        <div className="pl-10 space-y-3">
                                            <input 
                                                placeholder="Step Description"
                                                className="w-full bg-transparent border-b border-border focus:border-primary outline-none text-sm text-white pb-1" 
                                                value={step.step}
                                                onChange={(e) => {
                                                    const newSteps = [...currentCase.steps];
                                                    newSteps[idx] = {...newSteps[idx], step: e.target.value};
                                                    const newCases = [...editForm.testCases];
                                                    newCases[activeCaseIndex] = { ...currentCase, steps: newSteps };
                                                    setEditForm({...editForm, testCases: newCases});
                                                }}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input 
                                                    placeholder="Test Data"
                                                    className="w-full bg-surface border border-border rounded p-2 text-xs text-slate-300 focus:border-primary outline-none" 
                                                    value={step.data}
                                                    onChange={(e) => {
                                                        const newSteps = [...currentCase.steps];
                                                        newSteps[idx] = {...newSteps[idx], data: e.target.value};
                                                        const newCases = [...editForm.testCases];
                                                        newCases[activeCaseIndex] = { ...currentCase, steps: newSteps };
                                                        setEditForm({...editForm, testCases: newCases});
                                                    }}
                                                />
                                                <input 
                                                    placeholder="Expected Result"
                                                    className="w-full bg-surface border border-border rounded p-2 text-xs text-slate-300 focus:border-primary outline-none" 
                                                    value={step.expectedResult}
                                                    onChange={(e) => {
                                                        const newSteps = [...currentCase.steps];
                                                        newSteps[idx] = {...newSteps[idx], expectedResult: e.target.value};
                                                        const newCases = [...editForm.testCases];
                                                        newCases[activeCaseIndex] = { ...currentCase, steps: newSteps };
                                                        setEditForm({...editForm, testCases: newCases});
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const newSteps = currentCase.steps.filter((_, i) => i !== idx);
                                                const newCases = [...editForm.testCases];
                                                newCases[activeCaseIndex] = { ...currentCase, steps: newSteps };
                                                setEditForm({...editForm, testCases: newCases});
                                            }} 
                                            className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                <button 
                                    onClick={() => {
                                        const newSteps = [...currentCase.steps, {id: 'new', step: '', data: '', expectedResult: '', sqlScript: ''}];
                                        const newCases = [...editForm.testCases];
                                        newCases[activeCaseIndex] = { ...currentCase, steps: newSteps };
                                        setEditForm({...editForm, testCases: newCases});
                                    }}
                                    className="w-full py-3 border border-dashed border-border text-muted-foreground rounded-xl hover:border-primary hover:text-primary transition-all text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Step
                                </button>
                             </div>
                        </div>
                    </div>
                 )}
              </div>

              <div className="flex justify-end pt-4 gap-4 sticky bottom-0 bg-background/80 backdrop-blur-md p-4 border-t border-border z-20">
                 <button className="btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                 <button className="btn-primary" onClick={handleSave}>
                    <Save className="w-4 h-4" /> Save Template
                 </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-500">
               <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                    <LayoutGrid className="w-10 h-10 opacity-20" />
               </div>
               <p className="text-lg font-medium text-white mb-2">Select a template to edit</p>
               <p className="text-sm max-w-xs text-center">Choose a template from the sidebar or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Re-declare List here since it was used in Gatekeeper but not imported in the original file
// Actually I imported it at the top.

export default TemplateLibrary;
