import React, { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle, GitBranch, Activity } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AUTOMATION_RUN_ENDPOINT, AUTOMATION_RUNS_ENDPOINT, automationHeaders } from '../lib/api';
import { useTheme } from '../lib/state';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const WORKFLOWS = [
  { id: 'gitgrow', name: 'GitGrow', description: 'Main growth script', icon: Activity },
  { id: 'autotrack', name: 'AutoTrack', description: 'Update stats', icon: Activity },
  { id: 'autostargrow', name: 'StarGrow', description: 'Star repos', icon: Activity },
  { id: 'autostarback', name: 'StarBack', description: 'Star back', icon: Activity },
  { id: 'autounstarback', name: 'UnstarBack', description: 'Unstar non-recip', icon: Activity },
];

const fetchAutomationRuns = async () => {
  const res = await fetch(AUTOMATION_RUNS_ENDPOINT, { headers: automationHeaders() });
  if (!res.ok) throw new Error('Failed to fetch runs');
  return res.json();
};

const AutomationItem = ({ workflow, lastRun }) => {
  const { isDarkMode } = useTheme();
  const [status, setStatus] = useState('idle'); // idle, running, success, error

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(AUTOMATION_RUN_ENDPOINT, {
        method: 'POST',
        headers: automationHeaders(),
        body: JSON.stringify({ action: workflow.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed');
      }
      return res.json();
    },
    onMutate: () => {
      setStatus('running');
    },
    onSuccess: () => {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    },
    onError: () => {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    },
  });

  const Icon = workflow.icon;
  const lastStatus = lastRun?.last_run?.conclusion; // success, failure, etc.
  const lastTime = lastRun?.last_run?.created_at ? new Date(lastRun.last_run.created_at).toLocaleTimeString() : null;

  return (
    <div className={`group flex items-center justify-between p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="relative">
          <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-slate-700 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>
            <Icon className="w-4 h-4" />
          </div>
          {lastStatus && (
            <Badge
              variant={lastStatus === 'success' ? 'default' : lastStatus === 'failure' ? 'destructive' : 'secondary'}
              className={`absolute -bottom-2 -right-2 h-4 w-4 p-0 flex items-center justify-center rounded-full border-2 ${isDarkMode ? 'border-slate-800' : 'border-white'}`}
              title={`Last run: ${lastStatus}`}
            >
              <span className="sr-only">{lastStatus}</span>
            </Badge>
          )}
        </div>
        <div className="truncate">
          <h3 className={`text-sm font-medium truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{workflow.name}</h3>
          <div className="flex items-center gap-1">
            <p className={`text-[10px] truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{workflow.description}</p>
            {lastTime && <span className={`text-[9px] ${isDarkMode ? 'text-slate-600' : 'text-slate-500'}`}>• {lastTime}</span>}
          </div>
        </div>
      </div>

      <Button
        onClick={() => runMutation.mutate()}
        disabled={status === 'running'}
        variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'outline'}
        size="icon"
        className={`h-8 w-8 transition-all ${status === 'idle' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
      >
        {status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> :
          status === 'success' ? <CheckCircle className="w-4 h-4" /> :
            status === 'error' ? <XCircle className="w-4 h-4" /> :
              <Play className="w-4 h-4" />}
      </Button>
    </div>
  );
};

const AutomationsPanel = () => {
  const { data: runs } = useQuery({
    queryKey: ['automationRuns'],
    queryFn: fetchAutomationRuns,
    refetchInterval: 10000, // Poll every 10s
  });

  return (
    <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <GitBranch className="h-5 w-5 text-indigo-500" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Mission Control</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {WORKFLOWS.map(wf => {
          const lastRun = runs?.find((r: any) => r.action === wf.id);
          return <AutomationItem key={wf.id} workflow={wf} lastRun={lastRun} />;
        })}
      </CardContent>
    </Card>
  );
};

export default AutomationsPanel;
