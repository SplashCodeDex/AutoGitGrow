export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const STATS_ENDPOINT = `${API_BASE_URL}/stats`;
export const ACTIVITY_FEED_ENDPOINT = `${API_BASE_URL}/activity-feed`;
export const FOLLOWER_GROWTH_ENDPOINT = `${API_BASE_URL}/follower-growth`;
export const RECIPROCITY_ENDPOINT = `${API_BASE_URL}/reciprocity`;
export const DETAILED_USERS_ENDPOINT = `${API_BASE_URL}/detailed-users`;
export const DETAILED_REPOSITORIES_ENDPOINT = `${API_BASE_URL}/detailed-repositories`;
