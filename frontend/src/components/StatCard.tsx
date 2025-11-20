import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Play, Settings2 } from 'lucide-react';
import { CardContainer, CardBody, CardItem } from './ui/3d-card';
import AutomationControlPopover from './AutomationControlPopover';
import { useMutation } from '@tanstack/react-query';
import { AUTOMATION_RUN_ENDPOINT, automationHeaders } from '../lib/api';
import { toast } from 'sonner';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  automationId?: string; // ID of the automation to trigger (e.g., 'autostargrow')
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, automationId }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(AUTOMATION_RUN_ENDPOINT, {
        method: 'POST',
        headers: automationHeaders(),
        body: JSON.stringify({ action: automationId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed');
      }
      return res.json();
    },
    onMutate: () => {
      setStatus('running');
      setLogs(prev => [...prev, `Starting ${title} automation...`]);
    },
    onSuccess: (data) => {
      setStatus('success');
      setLogs(prev => [...prev, `Success: ${data.message || 'Completed'}`]);
      toast.success(`${title} automation completed!`);
      // setTimeout(() => setStatus('idle'), 5000);
    },
    onError: (error: Error) => {
      setStatus('error');
      setLogs(prev => [...prev, `Error: ${error.message}`]);
      toast.error(`Failed to run ${title}`);
    },
  });

  const handleStart = () => {
    runMutation.mutate();
  };

  const handleStop = () => {
    // In a real app, we'd hit a stop endpoint. For now, just reset UI.
    setStatus('idle');
    setLogs(prev => [...prev, 'Stopped by user.']);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-full"
      >
        <CardContainer className="inter-var h-full">
          <CardBody className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border border-slate-200/80 dark:border-slate-700 w-full h-full min-h-[120px] relative overflow-hidden">

            {/* Automation Trigger Button (Only if automationId is present) */}
            {automationId && (
              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPopoverOpen(true); }}
                  className="p-1.5 bg-indigo-500 text-white rounded-full shadow-md hover:bg-indigo-600 transition-colors"
                  title="Run Automation"
                >
                  <Settings2 className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-center space-x-3 mb-2">
              <CardItem translateZ="50" className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 transition-transform duration-300 group-hover:scale-110`}>
                <Icon className={`h-5 w-5 ${color.split(' ')[0]}`} />
              </CardItem>
              <CardItem translateZ="60">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
              </CardItem>
            </div>

            <CardItem translateZ="80" className="mt-auto">
              <div className="flex items-end justify-between w-full">
                <p className="text-2xl font-bold text-slate-800 dark:text-white truncate">{value}</p>
                {automationId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsPopoverOpen(true); }}
                    className="text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-3 h-3 fill-current" /> Run
                  </button>
                )}
              </div>
            </CardItem>
          </CardBody>
        </CardContainer>
      </motion.div>

      {/* Automation Control Popover */}
      {automationId && (
        <AutomationControlPopover
          isOpen={isPopoverOpen}
          onClose={() => setIsPopoverOpen(false)}
          title={`${title} Automation`}
          status={status}
          logs={logs}
          onStart={handleStart}
          onStop={handleStop}
        />
      )}
    </>
  );
};

export default StatCard;
