export interface WhitelistItem {
    username: string;
    added_at?: string;
}

export interface ActivityItem {
    user: string;
    type: 'follow' | 'star' | 'unfollow' | 'other';
    action: string;
    time: string;
}

export interface GrowthMetric {
    date: string;
    followers: number;
    following: number;
}

export interface UserStats {
    followers: number;
    following: number;
    starredRepos: number;
    mutualFollowers: number;
}

export interface ReciprocityData {
    mutuals: string[];
    fans: string[];
    nonFollowers: string[];
}
