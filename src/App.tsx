import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Template, JiraTicket, TestCase, HistoryEntry } from './types/index';
import { INITIAL_TEMPLATES, fetchJiraTicket } from './services/mockService';
import { interpolate } from './lib/utils';
import TemplateLibrary from './components/TemplateLibrary';
import Harvester from './components/Harvester';
import LoadingForge from './components/LoadingForge';
import Gatekeeper from './components/Gatekeeper';
import HistoryLog from './components/HistoryLog';
import { AnimatePresence, motion } from 'motion/react';

const ZephyrGateApp = () => {
  const [view, setView] = useState<'HOME' | 'TEMPLATES' | 'HISTORY' | 'HISTORY_DETAILS'>('HOME');
  const [stage, setStage] = useState<'HARVEST' | 'FORGE' | 'GATEKEEPER'>('HARVEST');
  
  // App Data State
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [currentJiraTicket, setCurrentJiraTicket] = useState<JiraTicket | null>(null);
  const [mergedTestCases, setMergedTestCases] = useState<TestCase[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [currentZephyrKeys, setCurrentZephyrKeys] = useState<string[]>([]);
  
  // History State
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zephyr_gate_history');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      }
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zephyr_gate_history', JSON.stringify(history));
    }
  }, [history]);

  // Cancellation tracking
  const extractionRequestId = useRef(0);

  const addToHistory = (ticket: JiraTicket, cases: TestCase[], zephyrKeys?: string[], existingId?: string) => {
    const newEntry: HistoryEntry = {
      id: existingId || `hist-${Date.now()}`,
      timestamp: Date.now(),
      jiraTicket: ticket,
      testCases: cases,
      zephyrKeys
    };

    setHistory(prev => {
      // If updating an existing entry (by ID), replace it. Otherwise add new.
      const index = prev.findIndex(h => h.id === newEntry.id);
      if (index >= 0) {
        const newHistory = [...prev];
        newHistory[index] = newEntry;
        return newHistory;
      }
      return [newEntry, ...prev];
    });
    
    return newEntry.id;
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const handleLoadHistoryEntry = (entry: HistoryEntry) => {
    setCurrentJiraTicket(entry.jiraTicket);
    setMergedTestCases(entry.testCases);
    setCurrentHistoryId(entry.id);
    setCurrentZephyrKeys(entry.zephyrKeys || []);
    setView('HISTORY_DETAILS');
    setStage('GATEKEEPER');
  };

  const handleHarvest = async (key: string, templateId: string) => {
    // Increment ID to invalidate any previous requests
    const currentRequestId = ++extractionRequestId.current;
    
    // 1. Fetch Jira
    const ticket = await fetchJiraTicket(key);
    
    // Check if cancelled during Jira fetch
    if (currentRequestId !== extractionRequestId.current) return;

    setCurrentJiraTicket(ticket);
    setStage('FORGE');

    const selectedTemplate = templates.find(t => t.id === templateId);
    if (!selectedTemplate) {
        setStage('HARVEST');
        alert("Template not found error");
        return;
    }

    try {
      // 2. AI Extraction
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      
      const vars = selectedTemplate.variables;
      const prompt = `
        You are a Data Extractor. 
        Extract values for the following keys based on the text provided.
        Keys to Extract: ${JSON.stringify(vars)}
        
        Source Text:
        Summary: ${ticket.summary}
        Description: ${ticket.description}
        Acceptance Criteria: ${ticket.acceptanceCriteria}
        
        Return STRICT JSON in this format: { "key1": "value1", "key2": "value2" }.
        If a value is not found, infer it or leave it as "CHECK_ME".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
             type: Type.OBJECT,
             properties: vars.reduce((acc, v) => ({ ...acc, [v]: { type: Type.STRING } }), {})
          }
        }
      });
      
      // Check if cancelled during AI generation
      if (currentRequestId !== extractionRequestId.current) return;
      
      const jsonText = response.text || "{}";
      const extractedParams = JSON.parse(jsonText);

      // 3. Initial Merge (Multiple Cases)
      const mergedCases: TestCase[] = selectedTemplate.testCases.map((tplCase, idx) => {
         const newSteps = tplCase.steps.map((s, stepIdx) => ({
             ...s,
             id: `step-gen-${idx}-${stepIdx}`,
             step: interpolate(s.step, extractedParams),
             data: interpolate(s.data, extractedParams),
             expectedResult: interpolate(s.expectedResult, extractedParams),
             sqlScript: interpolate(s.sqlScript || '', extractedParams),
             // Store raw templates for re-interpolation
             rawStep: s.step,
             rawData: s.data,
             rawExpectedResult: s.expectedResult,
             rawSqlScript: s.sqlScript
         }));

         return {
             id: `tc-${Date.now()}-${idx}`,
             source: 'TEMPLATE',
             templateId: selectedTemplate.id,
             parameters: extractedParams,
             title: interpolate(tplCase.title, extractedParams),
             objective: interpolate(tplCase.objective, extractedParams),
             preconditions: tplCase.preconditions ? interpolate(tplCase.preconditions, extractedParams) : '',
             steps: newSteps,
             
             // Initialze new fields (defaults if not in template)
             status: tplCase.status || 'Draft',
             priority: tplCase.priority || 'Normal',
             component: tplCase.component || 'None',
             owner: tplCase.owner || 'Unassigned',
             estimatedTime: tplCase.estimatedTime || '00:05',
             folder: tplCase.folder || 'None',
             labels: tplCase.labels || [],

             // Store raw templates
             rawTitle: tplCase.title,
             rawObjective: tplCase.objective,
             rawPreconditions: tplCase.preconditions
         };
      });

      setMergedTestCases(mergedCases);
      setCurrentZephyrKeys([]);

      setStage('GATEKEEPER');

    } catch (error) {
      if (currentRequestId !== extractionRequestId.current) return;
      console.error("Error in Forge:", error);
      alert("Failed to extract parameters. Please check API Key.");
      setStage('HARVEST');
    }
  };

  const handleReset = () => {
    setStage('HARVEST');
    setCurrentJiraTicket(null);
    setMergedTestCases([]);
    setCurrentHistoryId(null);
    setCurrentZephyrKeys([]);
  };

  const handleUpdateHistory = (finalCases: TestCase[], zephyrKeys: string[]) => {
      if (currentJiraTicket) {
          const newId = addToHistory(currentJiraTicket, finalCases, zephyrKeys, currentHistoryId || undefined);
          if (!currentHistoryId) {
              setCurrentHistoryId(newId);
          }
      }
  };

  const handleCancelExtraction = () => {
     // Invalidate current request
     extractionRequestId.current++;
     setStage('HARVEST');
  };

  const handleSaveTemplate = (updatedTpl: Template) => {
     if (updatedTpl.id.startsWith('tpl-new')) {
         setTemplates([...templates, updatedTpl]);
     } else {
         setTemplates(templates.map(t => t.id === updatedTpl.id ? updatedTpl : t));
     }
  };
  
  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleManualCreate = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (!selectedTemplate) {
        alert("Template not found error");
        return;
    }

    // Create a placeholder ticket
    const dummyTicket: JiraTicket = {
        key: 'MANUAL',
        summary: 'Manual Test Case Creation',
        description: 'No Jira ticket linked. Created manually.',
        acceptanceCriteria: 'N/A',
        reporter: 'User',
        priority: 'Medium'
    };
    setCurrentJiraTicket(dummyTicket);

    // Initialize cases from template without extraction (empty params)
    const emptyParams = selectedTemplate.variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {});
    
    const mergedCases: TestCase[] = selectedTemplate.testCases.map((tplCase, idx) => {
         const newSteps = tplCase.steps.map((s, stepIdx) => ({
             ...s,
             id: `step-manual-${idx}-${stepIdx}`,
             // Use raw values initially since params are empty
             step: s.step,
             data: s.data,
             expectedResult: s.expectedResult,
             sqlScript: s.sqlScript || '',
             // Store raw templates
             rawStep: s.step,
             rawData: s.data,
             rawExpectedResult: s.expectedResult,
             rawSqlScript: s.sqlScript
         }));

         return {
             id: `tc-manual-${Date.now()}-${idx}`,
             source: 'TEMPLATE',
             templateId: selectedTemplate.id,
             parameters: emptyParams,
             title: tplCase.title,
             objective: tplCase.objective,
             preconditions: tplCase.preconditions || '',
             steps: newSteps,
             
             status: tplCase.status || 'Draft',
             priority: tplCase.priority || 'Normal',
             component: tplCase.component || 'None',
             owner: tplCase.owner || 'Unassigned',
             estimatedTime: tplCase.estimatedTime || '00:05',
             folder: tplCase.folder || 'None',
             labels: tplCase.labels || [],

             rawTitle: tplCase.title,
             rawObjective: tplCase.objective,
             rawPreconditions: tplCase.preconditions
         };
    });

    setMergedTestCases(mergedCases);

    setStage('GATEKEEPER');
  };

  if (view === 'TEMPLATES') {
    return (
      <TemplateLibrary 
        templates={templates} 
        onClose={() => setView('HOME')} 
        onSave={handleSaveTemplate}
        onDelete={handleDeleteTemplate} 
      />
    );
  }

  if (view === 'HISTORY') {
    return (
      <HistoryLog 
        history={history}
        onClose={() => setView('HOME')}
        onLoadEntry={handleLoadHistoryEntry}
        onDeleteEntry={handleDeleteHistoryEntry}
      />
    );
  }

  return (
    <div className="h-full w-full bg-background overflow-hidden relative">
      <AnimatePresence mode="wait">
        {stage === 'HARVEST' && (
           <motion.div 
             key="harvest"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 1.05 }}
             transition={{ duration: 0.3 }}
             className="h-full w-full absolute inset-0"
           >
             <Harvester 
                templates={templates} 
                onHarvest={handleHarvest} 
                onOpenLibrary={() => setView('TEMPLATES')}
                onOpenHistory={() => setView('HISTORY')}
                onManualCreate={handleManualCreate}
             />
           </motion.div>
        )}
        {stage === 'FORGE' && (
            <motion.div 
                key="forge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="h-full w-full absolute inset-0 z-50"
            >
                <LoadingForge onCancel={handleCancelExtraction} />
            </motion.div>
        )}
        {stage === 'GATEKEEPER' && currentJiraTicket && mergedTestCases.length > 0 && (
          <motion.div 
            key="gatekeeper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full absolute inset-0"
          >
            <Gatekeeper 
              jiraTicket={currentJiraTicket} 
              initialTestCases={mergedTestCases} 
              templates={templates}
              onReset={() => {
                  if (view === 'HISTORY_DETAILS') {
                      handleReset();
                      setView('HISTORY');
                  } else {
                      handleReset();
                  }
              }}
              onUpdateHistory={handleUpdateHistory}
              initialZephyrKeys={currentZephyrKeys}
              isHistoryView={view === 'HISTORY_DETAILS'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZephyrGateApp;
