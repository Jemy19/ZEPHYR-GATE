import React from 'react';
import { motion } from 'motion/react';
import { Loader2, X } from 'lucide-react';

const LoadingForge = ({ onCancel }: { onCancel: () => void }) => {
  return (
    <div className="flex flex-col h-full bg-background items-center justify-center relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-10 blur-3xl pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center space-y-8"
        >
            {/* Spinner */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                <motion.div 
                  className="absolute inset-0 border-4 border-surface rounded-full" 
                />
                <motion.div 
                  className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-4 border-4 border-surface rounded-full" 
                />
                <motion.div 
                  className="absolute inset-4 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center">
                     <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
            </div>

            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-white tracking-tight">Forging Test Cases</h2>
                <p className="text-muted-foreground max-w-sm mx-auto text-lg">
                    Analyzing acceptance criteria and interpolating template parameters...
                </p>
            </div>

            <button 
                onClick={onCancel}
                className="px-6 py-2.5 border border-border rounded-full text-muted-foreground hover:text-white hover:border-slate-500 hover:bg-surface transition-all text-sm font-medium flex items-center gap-2"
            >
                <X className="w-4 h-4" />
                Cancel Extraction
            </button>
        </motion.div>
    </div>
  );
};

export default LoadingForge;
