import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { marked } from 'marked';
import { Github, Users, UserPlus, UserMinus, Star, FileText, FileBadge, LayoutDashboard, Settings, Sun, Moon, Sparkles, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { GoogleGenAI } from "@google/genai";

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

async function fetchTextFromGitHub(owner, repo, path, branch = null) {
    const refQuery = branch ? `?ref=${branch}` : '';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${refQuery}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AutoGitGrow-Dashboard' }
    });
    if (!response.ok) {
      if (response.status === 404) {
        // For a text file like whitelist, not existing is not a fatal error.
        return '';
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return atob(data.content);
}

// --- Components ---

const GeminiInsights = ({ stats, growthData, isDarkMode }) => {
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateInsight = async () => {
    setIsLoading(true);
    setError('');
    setInsight('');

    if (!process.env.API_KEY) {
      setError("API_KEY environment variable not set. This feature requires a valid Gemini API key.");
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze the following weekly GitHub stats for an AutoGitGrow user.
        - Followers Gained: ${stats.followersGained}
        - Follow-backs Received: ${stats.followBacks}
        - Users Unfollowed: ${stats.unfollowed}
        - New Stargazers: ${stats.stargazers}

        Here is the follower growth data for the past week, showing total followers at the end of each day:
        ${growthData.map(d => `- ${d.name}: ${d.followers}`).join('\n')}

        Based on these stats and the growth trend, provide a concise, encouraging, and friendly summary (2-3 sentences max). 
        Start with a friendly greeting. 
        Include one actionable suggestion for how the user could improve their GitHub presence or networking. The suggestion should be specific and relevant to the data provided. For example, if follower growth is stalling, suggest engaging with the community more. If there's a good growth trend, suggest how to maintain momentum.
        Format the entire response as a single paragraph of plain text, without any markdown.
        End with a single, relevant emoji.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setInsight(response.text);

    } catch (e) {
      console.error("Gemini API Error:", e);
      setError("Failed to generate insight. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'} border`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Sparkles className="h-7 w-7 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Growth Insights</h2>
      </div>
      
      <div className="min-h-[6rem] flex flex-col justify-center" aria-live="polite">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        ) : insight ? (
          <p className="text-slate-600 dark:text-indigo-200 text-sm leading-relaxed">{insight}</p>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Get an AI-powered summary of your week's performance and a personalized tip for growth.
          </p>
        )}
      </div>

      <button
        onClick={handleGenerateInsight}
        disabled={isLoading}
        className="mt-5 w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
      >
        <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isLoading ? 'Generating Analysis...' : insight ? 'Regenerate Insight' : 'Generate Insight'}</span>
      </button>
    </div>
  )
};


const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border border-slate-200/80 dark:border-slate-700">
    <div className={`bg-opacity-10 p-3 rounded-full ${color} transition-transform duration-300 group-hover:scale-110`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);

const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 border border-slate-200/80 dark:border-slate-700">
        <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-full animate-pulse h-12 w-12"></div>
        <div className="w-full space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
        </div>
    </div>
);

const PageHeader = ({ title, subtitle }) => (
    <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
);

const Dashboard = ({ stats, growthData, activityFeed, loading, error, isDarkMode }) => {
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

    // FIX: Added types for the CustomTooltip props to resolve TypeScript error.
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
                    {(loading ? placeholderActivityFeedData : activityFeed).slice(0, 5).map((item, index) => {
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

const SettingsPage = () => {
    const [whitelistContent, setWhitelistContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const REPO_OWNER = 'SplashCodeDex';
        const REPO_NAME = 'AutoGitGrow';

        const fetchWhitelist = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch from the default branch by passing null for the branch parameter.
                const content = await fetchTextFromGitHub(REPO_OWNER, REPO_NAME, 'config/whitelist.txt', null);
                setWhitelistContent(content);
            } catch (err) {
                console.error("Error fetching whitelist:", err);
                setError('Error loading whitelist content. Please check your repository structure.');
                setWhitelistContent('');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWhitelist();
    }, []);

    return (
        <>
            <PageHeader title="Settings" subtitle="Manage your AutoGitGrow configuration." />
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto border border-slate-200/80 dark:border-slate-700">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Whitelist</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            Usernames in this list will be protected from all bot actions (e.g., unfollowing). Add one username per line.
                        </p>
                        <textarea
                            className="w-full h-48 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out font-mono text-sm text-slate-700 dark:text-slate-300"
                            placeholder={isLoading ? "Loading whitelist..." : "username1\nanother_user\nimportant_account"}
                            aria-label="Whitelist editor"
                            value={whitelistContent}
                            onChange={(e) => setWhitelistContent(e.target.value)}
                            readOnly={isLoading}
                        />
                        {error && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Note: Saving changes from this dashboard is not yet supported. Please edit <code>config/whitelist.txt</code> directly in your repository.
                        </p>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Actions</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                            Note: Interactive settings are coming soon! For now, please manage your configuration files directly in your repository.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button disabled className="px-6 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md cursor-not-allowed">
                                Cancel
                            </button>
                            <button disabled className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition cursor-not-allowed opacity-50">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


const proseStyles = (isDarkMode) => `
  .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { 
    color: ${isDarkMode ? '#fff' : '#111827'}; 
    border-bottom-color: ${isDarkMode ? '#4b5563' : '#e5e7eb'}; 
    padding-bottom: 0.3em; 
    margin-top: 1.5em; 
    margin-bottom: 1em; 
  }
  .prose a { color: #818cf8; text-decoration: none; }
  .prose a:hover { text-decoration: underline; }
  .prose code { 
    background-color: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
    padding: 0.2em 0.4em; 
    margin: 0; 
    font-size: 85%; 
    border-radius: 6px; 
    color: ${isDarkMode ? '#e5e7eb' : '#111827'}; 
  }
  .prose pre { 
    background-color: ${isDarkMode ? '#1f2937' : '#f9fafb'}; 
    padding: 1em; 
    overflow-x: auto; 
    border-radius: 8px; 
  }
  .prose pre code { background-color: transparent; padding: 0; }
  .prose blockquote { 
    border-left-color: ${isDarkMode ? '#4b5563' : '#e5e7eb'}; 
    color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
  }
  .prose ul { list-style-type: disc; }
  .prose li { margin-top: 0.5em; margin-bottom: 0.5em; }
  .prose p, .prose li { color: ${isDarkMode ? '#d1d5db' : '#374151'}; }
  .prose strong { color: ${isDarkMode ? '#fff' : '#000'}; }
`;

const MarkdownViewer = ({ file, title }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isDarkMode = useMemo(() => document.documentElement.classList.contains('dark'), []);

  useEffect(() => {
    setIsLoading(true);
    fetch(file)
      .then(res => res.ok ? res.text() : Promise.reject(`Failed to load ${file}`))
      .then(text => {
        setContent(marked(text));
      })
      .catch(err => {
        console.error("Error fetching file:", err);
        setContent('<p class="text-red-400">Error loading content.</p>');
      })
      .finally(() => setIsLoading(false));
  }, [file]);
  
  return (
    <>
      <style>{proseStyles(isDarkMode)}</style>
      <PageHeader title={title} subtitle={`Content of ${file}`} />
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg prose max-w-none border border-slate-200/80 dark:border-slate-700">
        {isLoading ? (
             <div className="space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
            </div>
        ) : <div dangerouslySetInnerHTML={{ __html: content }} />}
      </div>
    </>
  )
}

const TextViewer = ({ file, title }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch(file)
            .then(res => res.ok ? res.text() : Promise.reject(`Failed to load ${file}`))
            .then(text => {
                setContent(text);
            })
            .catch(err => {
                console.error("Error fetching file:", err);
                setContent('Error loading content.');
            })
            .finally(() => setIsLoading(false));
    }, [file]);

    return (
        <>
            <PageHeader title={title} subtitle={`Content of ${file}`} />
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200/80 dark:border-slate-700">
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                ) : <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm font-mono">{content}</pre>}
            </div>
        </>
    )
}

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
      stats: placeholderStatsData,
      growthData: placeholderFollowerGrowthData,
      activityFeed: placeholderActivityFeedData,
      loading: true,
      error: null,
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedTheme = window.localStorage.getItem('theme');
        return storedTheme === 'dark' || (storedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
      const REPO_OWNER = 'SplashCodeDex';
      const REPO_NAME = 'AutoGitGrow';
      
      const fetchDashboardData = async () => {
          try {
              const [statsFile, activityFile] = await Promise.all([
                  fetchFromGitHub(REPO_OWNER, REPO_NAME, '.github/state/follower_stats.json'),
                  fetchFromGitHub(REPO_OWNER, REPO_NAME, '.github/state/activity_log.json'),
              ]);
              
              const parsedActivity = activityFile.map(item => ({
                  ...item,
                  time: new Date(item.time)
              })).sort((a,b) => b.time - a.time);

              setDashboardData({
                  stats: statsFile.stats,
                  growthData: statsFile.growth,
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
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'changelog', label: 'Changelog', icon: FileText },
    { id: 'license', label: 'License', icon: FileBadge },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
                  stats={dashboardData.stats} 
                  growthData={dashboardData.growthData} 
                  activityFeed={dashboardData.activityFeed}
                  loading={dashboardData.loading}
                  error={dashboardData.error}
                  isDarkMode={isDarkMode}
               />;
      case 'settings':
        return <SettingsPage />;
      case 'changelog':
        return <MarkdownViewer file="/CHANGELOG.md" title="Changelog" />;
      case 'license':
        return <TextViewer file="/LICENSE.txt" title="License" />;
      default:
        return <Dashboard 
                stats={dashboardData.stats} 
                growthData={dashboardData.growthData} 
                activityFeed={dashboardData.activityFeed}
                loading={dashboardData.loading}
                error={dashboardData.error}
                isDarkMode={isDarkMode}
                />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-sans flex antialiased">
      <aside className="w-60 bg-white dark:bg-slate-800 p-4 flex-col fixed h-full hidden md:flex shadow-md border-r border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center space-x-3 mb-10 p-2">
          <Github className="h-10 w-10 text-indigo-500" />
          <span className="text-xl font-bold text-slate-800 dark:text-white">AutoGitGrow</span>
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-left font-medium relative ${
                    activeTab === item.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-2">
            <button
                onClick={toggleTheme}
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors duration-200"
            >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="text-xs text-slate-500 dark:text-slate-600 text-center mt-4">
                <p>Maintained by <br/><a href="https://github.com/SplashCodeDex" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-500 hover:underline">SplashCodeDex</a></p>
            </div>
        </div>
      </aside>
      
      <main className="flex-1 md:ml-60 p-4 sm:p-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}