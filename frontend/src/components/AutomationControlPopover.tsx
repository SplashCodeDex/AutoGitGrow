import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Square, Loader2, Terminal } from 'lucide-react';
import { Button } from './ui/button';


interface AutomationControlPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    status: 'idle' | 'running' | 'success' | 'error';
    logs: string[];
    onStart: () => void;
    onStop: () => void;
}

const AutomationControlPopover: React.FC<AutomationControlPopoverProps> = ({
    isOpen,
    onClose,
    title,
    status,
    logs,
    onStart,
    onStop,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />

                    {/* Popover */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="fixed z-50 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-500" />
                                {title}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Status Indicator */}
                            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`relative flex h-3 w-3`}>
                                        {status === 'running' && (
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        )}
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${status === 'running' ? 'bg-indigo-500' :
                                            status === 'success' ? 'bg-green-500' :
                                                status === 'error' ? 'bg-red-500' : 'bg-slate-400'
                                            }`}></span>
                                    </div>
                                    <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                                        {status === 'idle' ? 'Ready to start' : status}
                                    </span>
                                </div>

                                {status === 'running' ? (
                                    <Button variant="destructive" size="sm" onClick={onStop} className="h-8">
                                        <Square className="w-3 h-3 mr-2 fill-current" /> Stop
                                    </Button>
                                ) : (
                                    <Button variant="default" size="sm" onClick={onStart} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                                        <Play className="w-3 h-3 mr-2 fill-current" /> Start
                                    </Button>
                                )}
                            </div>

                            {/* Logs Area */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Logs</label>
                                <div className="h-[200px] w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 overflow-y-auto custom-scrollbar">
                                    <div className="font-mono text-xs space-y-1">
                                        {logs.length === 0 ? (
                                            <span className="text-slate-500 italic">Waiting for logs...</span>
                                        ) : (
                                            logs.map((log, i) => (
                                                <div key={i} className="text-slate-300 border-l-2 border-indigo-500/30 pl-2">
                                                    <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                                    {log}
                                                </div>
                                            ))
                                        )}
                                        {status === 'running' && (
                                            <div className="flex items-center gap-2 text-indigo-400 mt-2 animate-pulse">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AutomationControlPopover;
