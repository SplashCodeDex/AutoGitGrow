import React, { useEffect, useMemo, useState } from 'react';
import { Play, Rocket, Workflow, Zap, Star, Users, UserMinus, Megaphone } from 'lucide-react';
import { AUTOMATION_RUN_ENDPOINT, AUTOMATION_RUNS_ENDPOINT, automationHeaders } from '../lib/api';
import { useTheme } from '../lib/state';

const actions: { key: string; label: string; icon: any; description: string; destructive?: boolean }[] = [
  { key: 'manual_follow', label: 'Follow', icon: Users, description: 'Follow a batch of users (manual trigger).' },
  { key: 'manual_unfollow', label: 'Unfollow', icon: UserMinus, description: 'Unfollow non-reciprocals (manual trigger).', destructive: true },
  { key: 'autostarback', label: 'Star Back', icon: Star, description: 'Star back users who starred your repos.' },
  { key: 'autostargrow', label: 'Star Grow', icon: Zap, description: 'Star repos from a random selection to grow reach.' },
  { key: 'autotrack', label: 'Track Stargazers', icon: Workflow, description: 'Track stargazers and update state.' },
  { key: 'autounstarback', label: 'Unstar Back', icon: Star, description: 'Unstar users who unstarred you.', destructive: true },
  { key: 'stargazer_shoutouts', label: 'Shoutouts', icon: Megaphone, description: 'Generate shoutouts for new and lost stargazers.' },
];

const AutomationsPanel: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<string>('');
  const [actionsUrl, setActionsUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [pollMs, setPollMs] = useState<number>(15000);
  const [lastRuns, setLastRuns] = useState<Record<string, any>>({});

  const actionsMap = useMemo(() => Object.fromEntries(actions.map(a => [a.key, a])), []);

  const fetchLastRun = async (key?: string) => {
    try {
      const url = key ? `${AUTOMATION_RUNS_ENDPOINT}?action=${encodeURIComponent(key)}` : `${AUTOMATION_RUNS_ENDPOINT}`;
      const res = await fetch(url, { headers: automationHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (key) {
        setLastRuns(prev => ({ ...prev, [key]: data.last_run }));
      } else if (Array.isArray(data)) {
        const map: Record<string, any> = {};
        data.forEach((d: any) => { map[d.action] = d.last_run; });
        setLastRuns(map);
      }
    } catch {}
  };

  useEffect(() => {
    fetchLastRun();
    const id = setInterval(() => fetchLastRun(), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const runAction = async (key: string) => {
    setIsLoading(key);
    setStatus('');
    setActionsUrl(null);

    try {
      const res = await fetch(AUTOMATION_RUN_ENDPOINT, {
        method: 'POST',
        headers: automationHeaders(),
        body: JSON.stringify({ action: key })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `${res.statusText}` }));
        throw new Error(err.detail || 'Request failed');
      }
      const data = await res.json();
      setStatus(data.message || 'Workflow dispatched.');
      if (data.actions_url) setActionsUrl(data.actions_url);
      fetchLastRun(key);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setIsLoading('');
    }
  };

  return (
    <div className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Automations</h2>
        <button onClick={() => setShowModal(true)} className={`px-3 py-1.5 text-sm rounded-md border ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 border-slate-600' : 'bg-slate-50 hover:bg-slate-100 border-slate-300'}`}>Run…</button>
      </div>
      <p className="text-sm mb-2 text-slate-600 dark:text-slate-400">Trigger GitHub Actions workflows on demand. Requires backend to be configured with a PAT that has workflow scope.</p>
      <div className="flex items-center gap-2 text-xs mb-4 text-slate-600 dark:text-slate-400">
        Poll every
        <select value={pollMs} onChange={e => setPollMs(parseInt(e.target.value))} className={`ml-1 px-2 py-1 rounded border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}>
          <option value={15000}>15s</option>
          <option value={30000}>30s</option>
          <option value={60000}>60s</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map(a => (
          <button key={a.key} onClick={() => (a.destructive ? setConfirmKey(a.key) : runAction(a.key))} disabled={!!isLoading}
            className={`flex items-start gap-3 p-4 rounded-xl text-left transition border ${isDarkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
            <a.icon className={`h-5 w-5 mt-0.5 ${isLoading === a.key ? 'animate-pulse' : ''}`} />
            <div>
              <div className="font-semibold">{a.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{a.description}</div>
              {lastRuns[a.key] && (
                <div className="text-[11px] mt-1 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      lastRuns[a.key]?.conclusion === 'success' ? 'bg-green-500' :
                      lastRuns[a.key]?.conclusion === 'failure' || lastRuns[a.key]?.conclusion === 'cancelled' ? 'bg-red-500' :
                      (lastRuns[a.key]?.status === 'in_progress' || lastRuns[a.key]?.status === 'queued') ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    title={`Last run: ${(lastRuns[a.key]?.conclusion || lastRuns[a.key]?.status || 'unknown')} at ${new Date(lastRuns[a.key]?.created_at).toLocaleString()}`}
                  />
                  <span>
                    Last: {lastRuns[a.key]?.conclusion || lastRuns[a.key]?.status || 'unknown'} • {new Date(lastRuns[a.key]?.created_at).toLocaleString()}
                  </span>
                  {lastRuns[a.key]?.html_url && (
                    <a href={lastRuns[a.key].html_url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline" title="Open run in GitHub">run ↗</a>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-sm">
        {isLoading ? (
          <div className="text-slate-500">Dispatching...</div>
        ) : status ? (
          <div className="text-slate-700 dark:text-slate-300">{status} {actionsUrl && (<a className="text-indigo-500 hover:underline" href={actionsUrl} target="_blank" rel="noreferrer">View runs</a>)}
          </div>
        ) : null}
      </div>
      {confirmKey && (
       <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
         <div className={`w-full max-w-md rounded-xl shadow-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">Confirm action</div>
           <div className="p-4 text-sm text-slate-600 dark:text-slate-300">
             Are you sure you want to run "{actionsMap[confirmKey]?.label}"? This may perform irreversible actions. Proceed with caution.
           </div>
           <div className="p-3 flex justify-end gap-2">
             <button onClick={() => setConfirmKey(null)} className={`px-3 py-1.5 text-sm rounded-md border ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 border-slate-600' : 'bg-white hover:bg-slate-100 border-slate-300'}`}>Cancel</button>
             <button onClick={() => { const k = confirmKey; setConfirmKey(null); if (k) runAction(k); }} className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white rounded-md">Run</button>
           </div>
         </div>
       </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-xl shadow-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="font-semibold">Run an automation</div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto space-y-2">
              {actions.map(a => (
                <div key={a.key} className={`flex items-start gap-3 p-3 rounded-lg border ${isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                  <a.icon className="h-5 w-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{a.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{a.description}</div>
                    {lastRuns[a.key] && (
                      <div className="text-[11px] mt-1 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            lastRuns[a.key]?.conclusion === 'success' ? 'bg-green-500' :
                            lastRuns[a.key]?.conclusion === 'failure' || lastRuns[a.key]?.conclusion === 'cancelled' ? 'bg-red-500' :
                            (lastRuns[a.key]?.status === 'in_progress' || lastRuns[a.key]?.status === 'queued') ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          title={`Last run: ${(lastRuns[a.key]?.conclusion || lastRuns[a.key]?.status || 'unknown')} at ${new Date(lastRuns[a.key]?.created_at).toLocaleString()}`}
                        />
                        <span>
                          Last: {lastRuns[a.key]?.conclusion || lastRuns[a.key]?.status || 'unknown'} • {new Date(lastRuns[a.key]?.created_at).toLocaleString()}
                        </span>
                        {lastRuns[a.key]?.html_url && (
                          <a href={lastRuns[a.key].html_url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline" title="Open run in GitHub">run ↗</a>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setShowModal(false); runAction(a.key); }} disabled={!!isLoading} className={`text-sm px-3 py-1.5 rounded-md border ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 border-slate-600' : 'bg-white hover:bg-slate-100 border-slate-300'}`}>Run</button>
                </div>
              ))}
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Note: Actions run via GitHub workflow_dispatch. Ensure your token has workflow scope. Use responsibly.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationsPanel;
