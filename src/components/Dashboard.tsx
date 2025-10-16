import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserPlus, UserMinus, Users, Star, AlertTriangle } from 'lucide-react';
import GeminiInsights from './GeminiInsights';
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

const Dashboard = () => {
    const { isDarkMode } = useTheme();
    const [showOnboarding, setShowOnboarding] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('hasSeenOnboarding');
        }
        return true;
    });

    const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
    const { data: activityFeed, isLoading: isLoadingActivityFeed, isError: isErrorActivityFeed } = useQuery({ queryKey: ['activityFeed'], queryFn: fetchActivityFeed });
    const { data: followerGrowth, isLoading: isLoadingFollowerGrowth, isError: isErrorFollowerGrowth } = useQuery({ queryKey: ['followerGrowth'], queryFn: fetchFollowerGrowth });
    const { data: reciprocity, isLoading: isLoadingReciprocity, isError: isErrorReciprocity } = useQuery({ queryKey: ['reciprocity'], queryFn: fetchReciprocity });

    const { data: detailedUsers, isLoading: isLoadingDetailedUsers, isError: isErrorDetailedUsers } = useQuery({
        queryKey: ['detailedUsers', stats?.suggested_users],
        queryFn: () => fetchDetailedUsers(stats.suggested_users),
        enabled: !!stats?.suggested_users,
    });

    const { data: detailedRepos, isLoading: isLoadingDetailedRepos, isError: isErrorDetailedRepos } = useQuery({
        queryKey: ['detailedRepos', stats?.top_repositories],
        queryFn: () => fetchDetailedRepos(stats.top_repositories.map(repo => repo.name)),
        enabled: !!stats?.top_repositories,
    });

    const isLoading = isLoadingStats || isLoadingActivityFeed || isLoadingFollowerGrowth || isLoadingReciprocity || isLoadingDetailedUsers || isLoadingDetailedRepos;
    const isError = isErrorStats || isErrorActivityFeed || isErrorFollowerGrowth || isErrorReciprocity || isErrorDetailedUsers || isErrorDetailedRepos;

    if (isError) {
        const errorMessage = isErrorStats ? 'Failed to load stats.' :
                             isErrorActivityFeed ? 'Failed to load activity feed.' :
                             isErrorFollowerGrowth ? 'Failed to load follower growth data.' :
                             isErrorReciprocity ? 'Failed to load reciprocity data.' :
                             isErrorDetailedUsers ? 'Failed to load detailed user data.' :
                             isErrorDetailedRepos ? 'Failed to load detailed repository data.' :
                             'An unknown error occurred.';
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Error Loading Dashboard Data</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">{errorMessage} Please try refreshing the page.</p>
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
        <>
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
            <PageHeader title="AutoGitGrow" subtitle="Your personal GitHub networking assistant analytics." />
            
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        <StatCard title="Follows" value={stats.followers} icon={UserPlus} color="text-green-500 bg-green-500" />
                        <StatCard title="Unfollows" value={stats.unfollows} icon={UserMinus} color="text-red-500 bg-red-500" />
                        <StatCard title="Stars" value={stats.stars} icon={Star} color="text-yellow-500 bg-yellow-500" />
                        <StatCard title="Unstars" value={stats.unstars} icon={UserMinus} color="text-red-500 bg-red-500" />
                        <StatCard title="Follow Backs" value={stats.follow_backs} icon={Users} color="text-blue-500 bg-blue-500" />
                        <StatCard title="Reciprocity Rate" value={`${stats.reciprocity_rate.toFixed(2)}%`} icon={Users} color="text-purple-500 bg-purple-500" />
                        <StatCard title="Growth Stars" value={stats.growth_stars} icon={Star} color="text-purple-500 bg-purple-500" />
                    </>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Follower Growth</h2>
                    {isLoading ? (
                         <div className="w-full h-[300px] bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ) : (
                    <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={growthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                         <defs>
                            <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                        <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#6b7280'} fontSize={12} />
                        <YAxis stroke={isDarkMode ? '#94a3b8' : '#6b7280'} fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize: "14px"}} />
                        <Area type="monotone" dataKey="followers" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorFollowers)" activeDot={{ r: 8, strokeWidth: 2 }} />
                    </AreaChart>
                    </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Activity Feed</h2>
                    <div className="space-y-4">
                    {(isLoading ? [{ type: 'Info', target: 'Waiting for first bot run...', time: new Date() }] : parsedActivity).slice(0, 5).map((item, index) => (
                        <ActivityCard key={index} item={item} />
                    ))}
                    </div>
                </div>
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Followed Back</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {reciprocity?.followed_back && reciprocity.followed_back.map((username) => (
                        <ReciprocityCard key={username} username={username} data={{ status: 'followed_back' }} />
                    ))}
                </div>
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Not Followed Back</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {reciprocity?.not_followed_back && reciprocity.not_followed_back.map((username) => (
                        <ReciprocityCard key={username} username={username} data={{ status: 'not_followed_back' }} />
                    ))}
                </div>
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Top Repositories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detailedRepos?.map((repo, index) => (
                        <InfoCard key={index} title={repo.name} data={repo} />
                    ))}
                </div>
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Suggested Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detailedUsers?.map((user, index) => (
                        <InfoCard key={index} title={user.username} data={user} />
                    ))}
                </div>
            </div>
            {!isLoading && <div className="mt-8"><GeminiInsights stats={stats} growthData={growthData} /></div>}
        </>
    )
};

export default Dashboard;