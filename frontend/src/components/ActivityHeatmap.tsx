import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useTheme } from '../lib/state';

interface ActivityHeatmapProps {
    activity: { date: string; count: number; type: 'high' | 'medium' | 'low' | 'none' }[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ activity }) => {
    const { isDarkMode } = useTheme();

    // Use provided activity data
    const data = activity;

    const getColor = (type: string) => {
        switch (type) {
            case 'high': return 'bg-green-600 dark:bg-green-500';
            case 'medium': return 'bg-green-400 dark:bg-green-600';
            case 'low': return 'bg-green-200 dark:bg-green-800';
            default: return 'bg-slate-100 dark:bg-slate-800';
        }
    };

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Activity Heatmap (30 Days)</h3>
            </div>
            <div className="flex gap-1 flex-wrap">
                <TooltipProvider>
                    {data.map((day, i) => (
                        <Tooltip key={i}>
                            <TooltipTrigger>
                                <div
                                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${getColor(day.type as string)} transition-colors hover:ring-2 ring-offset-1 ring-indigo-500 dark:ring-offset-slate-900`}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{day.date}: {day.count} actions</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
