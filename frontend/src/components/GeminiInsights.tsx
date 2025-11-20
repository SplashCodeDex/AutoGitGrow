import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../lib/state';
import { GEMINI_INSIGHT_ENDPOINT } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const GeminiInsights = ({ stats, growthData }) => {
  const { isDarkMode } = useTheme();
  const [insight, setInsight] = useState<{ summary: string, suggestions: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateInsight = async () => {
    setIsLoading(true);
    setError('');
    setInsight(null);

    try {
      const response = await fetch(GEMINI_INSIGHT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stats: {
            followersGained: stats.followersGained,
            followBacks: stats.followBacks,
            unfollowed: stats.unfollowed,
            stargazers: stats.stargazers,
            reciprocityRate: stats.reciprocityRate
          },
          growthData: growthData
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setInsight(data);

    } catch (e) {
      console.error("Gemini API Error:", e);
      setError("Failed to generate insight. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Sparkles className="h-7 w-7 text-indigo-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white">AI Growth Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[6rem] flex flex-col justify-center overflow-y-auto max-h-64" aria-live="polite">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          ) : insight ? (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-indigo-200 text-sm leading-relaxed">{insight.summary}</p>
              {insight.suggestions && insight.suggestions.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                  <h3 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">Action Plan</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {insight.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-xs text-slate-600 dark:text-slate-300">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Get an AI-powered summary of your week's performance and a personalized tip for growth.
            </p>
          )}
        </div>

        <Button
          onClick={handleGenerateInsight}
          disabled={isLoading}
          className="mt-5 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
        >
          <Sparkles className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Generating Analysis...' : insight ? 'Regenerate Insight' : 'Generate Insight'}</span>
        </Button>
      </CardContent>
    </Card>
  )
};

export default GeminiInsights;
