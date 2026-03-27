import React, { useState, useEffect } from 'react';
import { Template } from '../types/index';
import { motion } from 'motion/react';
import { Search, Sparkles, Plus, FileText, ArrowRight, Command, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const Harvester = ({ 
  templates, 
  onHarvest,
  onOpenLibrary,
  onOpenHistory,
  onManualCreate
}: { 
  templates: Template[], 
  onHarvest: (key: string, templateId: string) => void,
  onOpenLibrary: () => void,
  onOpenHistory: () => void,
  onManualCreate: (templateId: string) => void
}) => {
  const [jiraKey, setJiraKey] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');

  useEffect(() => {
     if (!selectedTemplateId && templates.length > 0) {
         setSelectedTemplateId(templates[0].id);
     }
  }, [templates, selectedTemplateId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jiraKey && selectedTemplateId) {
      onHarvest(jiraKey, selectedTemplateId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

        <button 
            onClick={onOpenHistory}
            className="absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors flex items-center gap-2 text-sm font-medium z-20"
        >
            <Clock className="w-4 h-4" /> History
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg z-10 space-y-8"
        >
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 shadow-lg shadow-primary/20 mb-2">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Zephyr Gate</h1>
                <p className="text-muted-foreground text-lg">AI-Powered Test Case Generation</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 shadow-2xl space-y-6 border border-white/10">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Command className="w-3 h-3" /> Jira Ticket
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            className="w-full bg-surface/50 border border-border text-white rounded-xl pl-10 pr-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 font-mono text-lg"
                            placeholder="PROJ-123"
                            value={jiraKey}
                            onChange={(e) => setJiraKey(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-3 h-3" /> Template
                        </label>
                        <button 
                            type="button" 
                            onClick={onOpenLibrary} 
                            className="text-xs text-primary hover:text-primary-hover hover:underline transition-all font-medium flex items-center gap-1"
                        >
                            Manage Templates <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="relative">
                        <select 
                            className="w-full bg-surface/50 border border-border text-white rounded-xl px-4 py-3.5 appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer text-sm"
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                        >
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                         <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                            <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                        </div>
                    </div>
                </div>

                <div className="pt-2 space-y-3">
                    <button 
                        type="submit"
                        disabled={!jiraKey || !selectedTemplateId}
                        className={cn(
                          "w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-lg",
                          (!jiraKey || !selectedTemplateId) && "opacity-50 cursor-not-allowed grayscale"
                        )}
                    >
                        <Sparkles className="w-5 h-5" />
                        Generate Test Cases
                    </button>
                    
                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase font-medium">Or</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>

                    <button 
                        type="button"
                        disabled={!selectedTemplateId}
                        onClick={() => onManualCreate(selectedTemplateId)}
                        className="w-full bg-surface hover:bg-surface-hover text-muted-foreground hover:text-white font-medium py-3.5 rounded-xl border border-border hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Manually
                    </button>
                </div>
            </form>
            
            <div className="text-center">
                 <p className="text-xs text-muted-foreground/60">
                    Supports Jira Cloud & Data Center. <br/>
                    Ensure you have permissions to view tickets.
                 </p>
            </div>
        </motion.div>
    </div>
  );
};

export default Harvester;
