import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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
        - Reciprocity Rate: ${stats.reciprocityRate}%

        Here is the follower growth data for the past week, showing total followers at the end of each day:
        ${growthData.map(d => `- ${d.name}: ${d.followers}`).join('\n')}

        Based on these stats and the growth trend, provide a concise, encouraging, and friendly summary (2-3 sentences max). 
        Start with a friendly greeting. 
        Include two actionable suggestions for how the user could improve their GitHub presence or networking. The suggestions should be specific and relevant to the data provided. For example, if the reciprocity rate is low, suggest starring back more repositories. If follower growth is stalling, suggest engaging with the community more. If there's a good growth trend, suggest how to maintain momentum.
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
    <div className={`p-6 rounded-2xl shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200/50'} border`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Sparkles className="h-7 w-7 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Growth Insights</h2>
      </div>
      
      <div className="min-h-[6rem] flex flex-col justify-center overflow-y-auto max-h-48" aria-live="polite">
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
        className="mt-5 w-full px-4 py-2.5 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-all duration-300 ease-in-out flex items-center justify-center space-x-2 font-semibold"
      >
        <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isLoading ? 'Generating Analysis...' : insight ? 'Regenerate Insight' : 'Generate Insight'}</span>
      </button>
    </div>
  )
};

export default GeminiInsights;
