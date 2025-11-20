import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../lib/state';

interface RateLimitGaugeProps {
    remaining: number;
    limit: number;
    reset: number;
}

const RateLimitGauge: React.FC<RateLimitGaugeProps> = ({ remaining, limit, reset }) => {
    const { isDarkMode } = useTheme();

    const data = [
        { name: 'Remaining', value: remaining },
        { name: 'Used', value: limit - remaining },
    ];

    const percentage = Math.round((remaining / limit) * 100);

    // Color logic: Green > 50%, Yellow > 20%, Red < 20%
    const color = percentage > 50 ? '#22c55e' : percentage > 20 ? '#eab308' : '#ef4444';
    const emptyColor = isDarkMode ? '#334155' : '#e2e8f0';

    const resetTime = new Date(reset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">API Rate Limit</h3>
            <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="remaining" fill={color} />
                            <Cell key="used" fill={emptyColor} />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{remaining}</span>
                    <span className="text-xs text-slate-400">/ {limit}</span>
                </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Resets at {resetTime}
            </div>
        </div>
    );
};

export default RateLimitGauge;
