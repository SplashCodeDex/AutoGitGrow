import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserPlus, UserMinus, Users, Star, Github, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import GeminiInsights from './GeminiInsights';
import StatCard from './StatCard';
import SkeletonCard from './SkeletonCard';
import PageHeader from './PageHeader';
import OnboardingMessage from './OnboardingMessage'; // Import the new component

// --- Placeholder Data (used as fallback) ---
const placeholderStatsData = {
  followersGained: 0,
  followBacks: 0,
  unfollowed: 0,
  stargazers: 0,
  growth_stars: 0,
  reciprocityRate: 0,
  topRepositories: [],
};

const placeholderFollowerGrowthData = Array.from({ length: 7 }, (_, i) => ({ name: `Day ${i + 1}`, followers: 0 }));

const placeholderActivityFeedData = [
    { type: 'Info', target: 'Waiting for first bot run...', time: new Date() },
];

import ReciprocityCard from './ReciprocityCard';
import ActivityCard from './ActivityCard';

const Dashboard = ({ isDarkMode }) => {
    const [dashboardData, setDashboardData] = useState({
        stats: { ...placeholderStatsData, growth_stars: 0 },
        growthData: placeholderFollowerGrowthData,
        activityFeed: placeholderActivityFeedData,
        reciprocity: {},
        topRepositories: [],
        suggestedUsers: [],
        loading: true,
        error: null,
    });
    const [showOnboarding, setShowOnboarding] = useState(true); // State to control visibility

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsResponse, activityFeedResponse, followerGrowthResponse] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/activity-feed'),
                    fetch('/api/follower-growth'),
                ]);

                if (!statsResponse.ok) throw new Error(`Failed to fetch stats: ${statsResponse.statusText}`, { cause: statsResponse });
                if (!activityFeedResponse.ok) throw new Error(`Failed to fetch activity feed: ${activityFeedResponse.statusText}`, { cause: activityFeedResponse });
                if (!followerGrowthResponse.ok) throw new Error(`Failed to fetch follower growth: ${followerGrowthResponse.statusText}`, { cause: followerGrowthResponse });

                const stats = await statsResponse.json();
                const activityFeed = await activityFeedResponse.json();
                const followerGrowth = await followerGrowthResponse.json();

                const parsedActivity = activityFeed.map(item => {
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
                }).sort((a, b) => b.time.getTime() - a.time.getTime());

                const growthData = followerGrowth.map(item => ({
                    name: new Date(item.timestamp).toLocaleDateString(),
                    followers: item.count,
                }));

                setDashboardData({
                    stats: {
                        followersGained: stats.followers,
                        followBacks: stats.follow_backs,
                        unfollowed: stats.unfollows,
                        stargazers: stats.stars,
                        unstargazers: stats.unstars,
                        reciprocityRate: stats.reciprocity_rate,
                        growth_stars: stats.growth_stars,
                    },
                    growthData: growthData,
                    activityFeed: parsedActivity,
                    reciprocity: {}, // This data is not yet available from the backend
                    topRepositories: stats.top_repositories,
                    suggestedUsers: stats.suggested_users,
                    loading: false,
                    error: null,
                } as any);

            } catch (e) {
                console.error("Failed to fetch dashboard data:", e);
                let errorMessage = e.message;
                if (e.cause instanceof Response) {
                    try {
                        const errorData = await e.cause.json();
                        errorMessage = errorData.detail || errorData.message || e.message;
                    } catch (jsonError) {
                        // The response was not JSON, so use the original error message
                    }
                }
                setDashboardData({
                    stats: placeholderStatsData,
                    growthData: placeholderFollowerGrowthData,
                    activityFeed: placeholderActivityFeedData,
                    reciprocity: {},
                    topRepositories: [],
                    suggestedUsers: [],
                    loading: false,
                    error: errorMessage,
                });
            }
        };

        fetchDashboardData();
    }, []);
    const { stats, growthData, activityFeed, reciprocity, topRepositories, suggestedUsers, loading, error } = dashboardData;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Failed to Load Dashboard Data</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">{error}</p>
                <p className="text-slate-500 dark:text-slate-500 mt-4 text-sm">Please try refreshing the page. If the problem persists, check your repository configuration.</p>
            </div>
        )
    }

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
            {showOnboarding && (
                <OnboardingMessage
                    onClose={() => setShowOnboarding(false)}
                    isDarkMode={isDarkMode}
                />
            )}
            <PageHeader title="AutoGitGrow Dashboard" subtitle="Your personal GitHub networking assistant analytics." />
            
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-8"
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
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        <StatCard title="Follows" value={stats.followersGained} icon={UserPlus} color="text-green-500 bg-green-500" />
                        <StatCard title="Unfollows" value={stats.unfollowed} icon={UserMinus} color="text-red-500 bg-red-500" />
                        <StatCard title="Stars" value={stats.stargazers} icon={Star} color="text-yellow-500 bg-yellow-500" />
                        <StatCard title="Unstars" value={stats.unstargazers} icon={UserMinus} color="text-red-500 bg-red-500" />
                        <StatCard title="Follow Backs" value={stats.followBacks} icon={Users} color="text-blue-500 bg-blue-500" />
                        <StatCard title="Reciprocity Rate" value={`${stats.reciprocityRate.toFixed(2)}%`} icon={Users} color="text-purple-500 bg-purple-500" />
                        <StatCard title="Growth Stars" value={stats.growth_stars} icon={Star} color="text-purple-500 bg-purple-500" />
                    </>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Follower Growth</h2>
                    {loading ? (
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
                    {(loading ? [{ type: 'Info', target: 'Waiting for first bot run...', time: new Date() }] : activityFeed).slice(0, 5).map((item, index) => (
                        <ActivityCard key={index} item={item} isDarkMode={isDarkMode} />
                    ))}
                    </div>
                </div>
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Reciprocity Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Object.entries(reciprocity).map(([username, data]) => (
                        <ReciprocityCard key={username} username={username} data={data} />
                    ))}
                </div>
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Top Repositories</h2>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700 overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Repository
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Stargazers
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {topRepositories.map((repo, index) => (
                                <tr key={index} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700">
                                                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white truncate">
                                                                        {repo.name}
                                                                    </th>                                    <td className="px-6 py-4">
                                        {repo.stargazers_count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Suggested Users</h2>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700">
                    <ul className="space-y-2">
                        {suggestedUsers.map((user, index) => (
                            <li key={index} className="text-slate-700 dark:text-slate-300 truncate">
                                <a href={`https://github.com/${user}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {user}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {!loading && <div className="mt-8"><GeminiInsights stats={stats} growthData={growthData} isDarkMode={isDarkMode} /></div>}
        </>
    )
};

export default Dashboard;