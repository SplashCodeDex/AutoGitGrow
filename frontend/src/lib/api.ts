export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const AUTOMATION_API_KEY = import.meta.env.VITE_AUTOMATION_API_KEY;
export const automationHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AUTOMATION_API_KEY) headers['X-Automation-Key'] = AUTOMATION_API_KEY;
  return headers;
};

export const STATS_ENDPOINT = `${API_BASE_URL}/stats`;
export const ACTIVITY_FEED_ENDPOINT = `${API_BASE_URL}/activity-feed`;
export const FOLLOWER_GROWTH_ENDPOINT = `${API_BASE_URL}/follower-growth`;
export const RECIPROCITY_ENDPOINT = `${API_BASE_URL}/reciprocity`;
export const DETAILED_USERS_ENDPOINT = `${API_BASE_URL}/detailed-users`;
export const DETAILED_REPOSITORIES_ENDPOINT = `${API_BASE_URL}/detailed-repositories`;
export const AUTOMATION_RUN_ENDPOINT = `${API_BASE_URL}/automation/run`;
export const AUTOMATION_RUNS_ENDPOINT = `${API_BASE_URL}/automation/runs`;
export const USER_ME_ENDPOINT = `${API_BASE_URL}/user/me`;
export const GEMINI_INSIGHT_ENDPOINT = `${API_BASE_URL}/gemini/insight`;
export const HEALTH_DETAILED_ENDPOINT = `${API_BASE_URL}/health/detailed`;
