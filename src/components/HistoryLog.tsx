import React, { useState } from 'react';
import { HistoryEntry } from '../types/index';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ArrowRight, 
  Trash2, 
  Search, 
  FileText, 
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

const HistoryLog = ({ 
  history, 
  onClose,
  onLoadEntry,
  onDeleteEntry
}: { 
  history: HistoryEntry[], 
  onClose: () => void,
  onLoadEntry: (entry: HistoryEntry) => void,
  onDeleteEntry: (id: string) => void
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredHistory = history.filter(entry => 
    entry.jiraTicket.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.jiraTicket.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.testCases.some(tc => tc.title.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => b.timestamp - a.timestamp);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(timestamp));
  };

  return (
    <div className="flex flex-col h-full w-full bg-background animate-fade-in relative">
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-destructive" />
                        Delete History Entry?
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                        Are you sure you want to remove this entry from your history? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setDeleteId(null)} className="btn-ghost text-sm">Cancel</button>
                        <button 
                            onClick={() => {
                                onDeleteEntry(deleteId);
                                setDeleteId(null);
                            }} 
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          Generation History
        </h2>
        <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                    placeholder="Search history..." 
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-4">
            {filteredHistory.length > 0 ? (
                filteredHistory.map((entry) => (
                    <motion.div 
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel rounded-xl p-6 hover:border-primary/30 transition-all group relative"
                    >
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 bg-jira/10 text-jira border border-jira/20 rounded text-xs font-bold font-mono">
                                        {entry.jiraTicket.key}
                                    </span>
                                    <h3 className="text-lg font-semibold text-white truncate">
                                        {entry.jiraTicket.summary}
                                    </h3>
                                </div>
                                
                                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(entry.timestamp)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5" />
                                        {entry.testCases.length} Test Cases Generated
                                    </span>
                                    {entry.zephyrKeys && entry.zephyrKeys.length > 0 ? (
                                        <span className="flex items-center gap-1.5 text-emerald-500">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Published to Zephyr
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-amber-500">
                                            <FileText className="w-3.5 h-3.5" />
                                            Draft
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {entry.testCases.slice(0, 3).map((tc, idx) => (
                                        <span key={idx} className="text-[10px] bg-surface border border-border px-2 py-1 rounded text-slate-400 truncate max-w-[200px]">
                                            {tc.title}
                                        </span>
                                    ))}
                                    {entry.testCases.length > 3 && (
                                        <span className="text-[10px] bg-surface border border-border px-2 py-1 rounded text-slate-400">
                                            +{entry.testCases.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-center">
                                <button 
                                    onClick={() => onLoadEntry(entry)}
                                    className="btn-secondary text-sm group-hover:border-primary/50 group-hover:text-white transition-colors"
                                >
                                    View Details <ArrowRight className="w-4 h-4 ml-1" />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteId(entry.id);
                                    }}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Entry"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-4 border border-border">
                        <Clock className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-lg font-medium text-white">No history found</p>
                    <p className="text-sm">Generated test cases will appear here.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default HistoryLog;
