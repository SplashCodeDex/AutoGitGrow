import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserPlus, UserMinus, Users, Star, AlertTriangle, GitFork, UserCheck, UserX, Search, Zap, Bot, Sparkles, Activity, Radio } from 'lucide-react';
import GeminiInsights from './GeminiInsights';
import SystemHealth from './SystemHealth';
import AutomationsPanel from './AutomationsPanel';
import StatCard from './StatCard';
import SkeletonCard from './SkeletonCard';
import PageHeader from './PageHeader';
import OnboardingMessage from './OnboardingMessage';
import { STATS_ENDPOINT, ACTIVITY_FEED_ENDPOINT, FOLLOWER_GROWTH_ENDPOINT, RECIPROCITY_ENDPOINT, DETAILED_USERS_ENDPOINT, DETAILED_REPOSITORIES_ENDPOINT } from '../lib/api';
import ReciprocityCard from './ReciprocityCard';
import ActivityCard from './ActivityCard';
import InfoCard from './InfoCard';
import { useTheme } from '../lib/state';
import { useQuery } from '@tanstack/react-query';

const fetchStats = async () => {
    const res = await fetch(STATS_ENDPOINT);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
};

const fetchActivityFeed = async () => {
    const res = await fetch(ACTIVITY_FEED_ENDPOINT);
    if (!res.ok) throw new Error('Failed to fetch activity feed');
    return res.json();
};

const fetchFollowerGrowth = async () => {
    const res = await fetch(FOLLOWER_GROWTH_ENDPOINT);
    if (!res.ok) throw new Error('Failed to fetch follower growth');
    return res.json();
};

const fetchReciprocity = async () => {
    const res = await fetch(RECIPROCITY_ENDPOINT);
    if (!res.ok) throw new Error('Failed to fetch reciprocity data');
    return res.json();
};

const fetchDetailedUsers = async (usernames) => {
    const res = await fetch(DETAILED_USERS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usernames),
    });
    if (!res.ok) throw new Error('Failed to fetch detailed users');
    return res.json();
};

const fetchDetailedRepos = async (repoNames) => {
    const res = await fetch(DETAILED_REPOSITORIES_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repoNames),
    });
    if (!res.ok) throw new Error('Failed to fetch detailed repositories');
    return res.json();
};

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => {
    const { isDarkMode } = useTheme();
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${active
                ? 'bg-indigo-500 text-white shadow-md'
                : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

const Dashboard = ({ view = 'overview' }: { view?: string }) => {
    const { isDarkMode } = useTheme();
    const [showOnboarding, setShowOnboarding] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('hasSeenOnboarding');
        }
        return true;
    });

    // Sub-tabs for Explorer (still needed for Network/Discovery views)
    const [networkSubTab, setNetworkSubTab] = useState<'followed_back' | 'not_followed_back'>('followed_back');
    const [discoverySubTab, setDiscoverySubTab] = useState<'users' | 'repos'>('users');

    const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = useQuery({
        queryKey: ['stats'],
        queryFn: fetchStats,
        refetchInterval: 30000
    });
    const { data: activityFeed, isLoading: isLoadingActivityFeed, isError: isErrorActivityFeed } = useQuery({
        queryKey: ['activityFeed'],
        queryFn: fetchActivityFeed,
        refetchInterval: 30000
    });
    const { data: followerGrowth, isLoading: isLoadingFollowerGrowth, isError: isErrorFollowerGrowth } = useQuery({
        queryKey: ['followerGrowth'],
        queryFn: fetchFollowerGrowth,
        refetchInterval: 60000
    });
    const { data: reciprocity, isLoading: isLoadingReciprocity, isError: isErrorReciprocity } = useQuery({
        queryKey: ['reciprocity'],
        queryFn: fetchReciprocity,
        refetchInterval: 60000
    });

    const { data: detailedUsers, isLoading: isLoadingDetailedUsers, isError: isErrorDetailedUsers } = useQuery({
        queryKey: ['detailedUsers', stats?.suggested_users],
        queryFn: () => fetchDetailedUsers(stats.suggested_users),
        enabled: !!stats?.suggested_users,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const { data: detailedRepos, isLoading: isLoadingDetailedRepos, isError: isErrorDetailedRepos } = useQuery({
        queryKey: ['detailedRepos', stats?.top_repositories],
        queryFn: () => fetchDetailedRepos(stats.top_repositories.map(repo => repo.name)),
        enabled: !!stats?.top_repositories,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const isLoading = isLoadingStats || isLoadingActivityFeed || isLoadingFollowerGrowth || isLoadingReciprocity || isLoadingDetailedUsers || isLoadingDetailedRepos;
    const isError = isErrorStats || isErrorActivityFeed || isErrorFollowerGrowth || isErrorReciprocity || isErrorDetailedUsers || isErrorDetailedRepos;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Error Loading Dashboard Data</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">Please check your connection and try again.</p>
            </div>
        )
    }

    const parsedActivity = activityFeed?.map(item => {
        let targetUsername = 'Unknown';
        if (item.event_type === 'follow' || item.event_type === 'unfollow') {
            targetUsername = item.target_user?.username || 'Unknown';
        } else if (item.event_type === 'star' || item.event_type === 'unstar') {
            targetUsername = item.source_user?.username || 'Unknown';
        } else if (item.event_type === 'followed_by') {
            targetUsername = item.source_user?.username || 'Unknown';
        }
        return {
            type: item.event_type,
            target: targetUsername,
            time: new Date(item.timestamp)
        };
    }).sort((a, b) => b.time.getTime() - a.time.getTime()) || [];

    const growthData = followerGrowth?.map(item => ({
        name: new Date(item.timestamp).toLocaleDateString(),
        followers: item.count,
    })) || [];

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string | number }) => {
        if (active && payload && payload.length) {
            return (
                <div className={`p-3 rounded-lg shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border`}>
                    <p className="label font-semibold text-slate-700 dark:text-slate-300">{`${label}`}</p>
                    <p className="intro text-indigo-500 dark:text-indigo-400">{`Followers : ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <AnimatePresence>
                {showOnboarding && (
                    <OnboardingMessage
                        onClose={() => {
                            setShowOnboarding(false);
                            localStorage.setItem('hasSeenOnboarding', 'true');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Header is always visible */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <PageHeader title="AutoGitGrow" subtitle="Your personal GitHub networking assistant." />
                    <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800/50">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
                    </div>
                </div>
                <SystemHealth />
            </div>

            {/* Overview View */}
            {view === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                    >
                        {isLoading ? (
                            Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
                        ) : (
                            <>
                                <StatCard title="Follows" value={stats.followers} icon={UserPlus} color="text-green-500 bg-green-500" />
                                <StatCard title="Unfollows" value={stats.unfollows} icon={UserMinus} color="text-red-500 bg-red-500" />
                                <StatCard title="Stars" value={stats.stars} icon={Star} color="text-yellow-500 bg-yellow-500" />
                                <StatCard title="Unstars" value={stats.unstars} icon={UserMinus} color="text-red-500 bg-red-500" />
                                <StatCard title="Follow Backs" value={stats.follow_backs} icon={Users} color="text-blue-500 bg-blue-500" />
                                <StatCard title="Reciprocity" value={`${stats.reciprocity_rate.toFixed(1)}%`} icon={Users} color="text-purple-500 bg-purple-500" />
                                <StatCard title="Growth Stars" value={stats.growth_stars} icon={Star} color="text-purple-500 bg-purple-500" />
                            </>
                        )}
                    </motion.div>

                    {/* Growth Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Growth Trends</h2>
                        </div>
                        {isLoading ? (
                            <div className="w-full h-[300px] bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={growthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                                    <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#6b7280'} fontSize={12} />
                                    <YAxis stroke={isDarkMode ? '#94a3b8' : '#6b7280'} fontSize={12} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="followers" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorFollowers)" activeDot={{ r: 8, strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </>
            )}

            {/* Insights View */}
            {view === 'insights' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Insights</h2>
                    </div>
                    {!isLoading && <GeminiInsights stats={stats} growthData={growthData} />}
                </div>
            )}

            {/* Automations View */}
            {view === 'automations' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Bot className="h-5 w-5 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Automations</h2>
                    </div>
                    {!isLoading && <AutomationsPanel />}
                </div>
            )}

            {/* Activity View */}
            {view === 'activity' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                            <Zap className="h-5 w-5 text-orange-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Activity</h2>
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {(isLoading ? [{ type: 'Info', target: 'Loading...', time: new Date() }] : parsedActivity).map((item, index) => (
                            <ActivityCard key={index} item={item} />
                        ))}
                    </div>
                </div>
            )}

            {/* Network View */}
            {view === 'network' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Network Status</h2>
                        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
                            <TabButton active={networkSubTab === 'followed_back'} onClick={() => setNetworkSubTab('followed_back')} icon={UserCheck} label="Followed Back" />
                            <TabButton active={networkSubTab === 'not_followed_back'} onClick={() => setNetworkSubTab('not_followed_back')} icon={UserX} label="Pending" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {networkSubTab === 'followed_back' ? (
                            reciprocity?.followed_back?.map((username) => (
                                <ReciprocityCard key={username} username={username} data={{ status: 'followed_back' }} />
                            ))
                        ) : (
                            reciprocity?.not_followed_back?.map((username) => (
                                <ReciprocityCard key={username} username={username} data={{ status: 'not_followed_back' }} />
                            ))
                        )}
                        {((networkSubTab === 'followed_back' && (!reciprocity?.followed_back || reciprocity.followed_back.length === 0)) ||
                            (networkSubTab === 'not_followed_back' && (!reciprocity?.not_followed_back || reciprocity.not_followed_back.length === 0))) && (
                                <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-10">
                                    <Users className="w-12 h-12 mb-2 opacity-50" />
                                    <p>No users found in this category.</p>
                                </div>
                            )}
                    </div>
                </div>
            )}

            {/* Discovery View */}
            {view === 'discovery' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Discovery</h2>
                        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
                            <TabButton active={discoverySubTab === 'users'} onClick={() => setDiscoverySubTab('users')} icon={Users} label="Users" />
                            <TabButton active={discoverySubTab === 'repos'} onClick={() => setDiscoverySubTab('repos')} icon={GitFork} label="Repos" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {discoverySubTab === 'users' ? (
                            detailedUsers?.map((user, index) => (
                                <InfoCard key={index} title={user.username} data={user} />
                            ))
                        ) : (
                            detailedRepos?.map((repo, index) => (
                                <InfoCard key={index} title={repo.name} data={repo} />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
};

export default Dashboard;
