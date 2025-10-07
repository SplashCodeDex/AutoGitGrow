import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserPlus, UserMinus, Users, Star, Github, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import GeminiInsights from './GeminiInsights';
import StatCard from './StatCard';
import SkeletonCard from './SkeletonCard';
import PageHeader from './PageHeader';

// --- Placeholder Data (used as fallback) ---
const placeholderStatsData = {
  followersGained: 0,
  followBacks: 0,
  unfollowed: 0,
  stargazers: 0,
};

const placeholderFollowerGrowthData = Array.from({ length: 7 }, (_, i) => ({ name: `Day ${i + 1}`, followers: 0 }));

const placeholderActivityFeedData = [
    { type: 'Info', target: 'Waiting for first bot run...', time: new Date() },
];


// --- API Helpers ---
async function fetchFromGitHub(owner, repo, path) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=tracker-data`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'AutoGitGrow-Dashboard' }
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Data file not found at '${path}'. Please ensure the bot has run at least once and the 'tracker-data' branch exists.`);
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const content = atob(data.content);
  return JSON.parse(content);
}

const Dashboard = ({ isDarkMode, repoOwner, repoName }) => {
    const [dashboardData, setDashboardData] = useState({
        stats: placeholderStatsData,
        growthData: placeholderFollowerGrowthData,
        activityFeed: placeholderActivityFeedData,
        loading: true,
        error: null,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const stargazerFile = await fetchFromGitHub(repoOwner, repoName, '.github/state/stargazer_state.json');

                const parsedActivity = stargazerFile.current_stargazers.map(item => ({
                    type: 'Star',
                    target: item,
                    time: new Date()
                })).sort((a, b) => b.time - a.time);

                setDashboardData({
                    stats: {
                        followersGained: 0,
                        followBacks: 0,
                        unfollowed: 0,
                        stargazers: stargazerFile.current_stargazers.length,
                        unstargazers: stargazerFile.unstargazers.length,
                    },
                    growthData: placeholderFollowerGrowthData, // Placeholder as this data is not in the new source
                    activityFeed: parsedActivity,
                    loading: false,
                    error: null,
                });

            } catch (e) {
                console.error("Failed to fetch dashboard data:", e);
                setDashboardData({
                    stats: placeholderStatsData,
                    growthData: placeholderFollowerGrowthData,
                    activityFeed: placeholderActivityFeedData,
                    loading: false,
                    error: e.message,
                });
            }
        };

        fetchDashboardData();
    }, [repoOwner, repoName]);
    const { stats, growthData, activityFeed, loading, error } = dashboardData;

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
            <PageHeader title="AutoGitGrow Dashboard" subtitle="Your personal GitHub networking assistant analytics." />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        <StatCard title="Followers Gained" value={stats.followersGained} icon={UserPlus} color="text-green-500 bg-green-500" />
                        <StatCard title="Follow-backs Received" value={stats.followBacks} icon={Users} color="text-blue-500 bg-blue-500" />
                        <StatCard title="Users Unfollowed" value={stats.unfollowed} icon={UserMinus} color="text-red-500 bg-red-500" />
                        <StatCard title="Unstargazers" value={stats.unstargazers} icon={UserMinus} color="text-red-500 bg-red-500" />
                        <StatCard title="New Stargazers" value={stats.stargazers} icon={Star} color="text-yellow-500 bg-yellow-500" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Follower Growth</h2>
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
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Activity Feed</h2>
                    <ul className="space-y-4">
                    {(loading ? [{ type: 'Info', target: 'Waiting for first bot run...', time: new Date() }] : activityFeed).slice(0, 5).map((item, index) => {
                        let Icon, color;
                        switch (item.type) {
                            case 'Follow': Icon = UserPlus; color = 'text-green-500'; break;
                            case 'Unfollow': Icon = UserMinus; color = 'text-red-500'; break;
                            case 'Star': Icon = Star; color = 'text-yellow-400'; break;
                            case 'New Follower': Icon = Users; color = 'text-blue-500'; break;
                            default: Icon = Github; color = 'text-slate-400';
                        }
                        return (
                            <li key={index} className="flex items-start space-x-3 text-sm">
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mt-1 flex-shrink-0">
                                    <Icon className={`h-4 w-4 ${color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-slate-700 dark:text-slate-300 truncate">
                                    <span className="font-semibold">{item.type}:</span> {item.target}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-500 text-xs">{formatDistanceToNow(item.time, { addSuffix: true })}</p>
                                </div>
                            </li>
                        );
                    })}
                    </ul>
                </div>
            </div>
            {!loading && <div className="mt-8"><GeminiInsights stats={stats} growthData={growthData} isDarkMode={isDarkMode} /></div>}
        </>
    )
};

export default Dashboard;