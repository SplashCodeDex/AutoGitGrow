import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../lib/state';

interface AutomationSuccessChartProps {
    data: { name: string; success: number; failure: number }[];
}

const AutomationSuccessChart: React.FC<AutomationSuccessChartProps> = ({ data }) => {
    const { isDarkMode } = useTheme();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`p-2 rounded shadow-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <p className="font-medium text-slate-800 dark:text-white">{label}</p>
                    <p className="text-green-500 text-sm">Success: {payload[0].value}</p>
                    <p className="text-red-500 text-sm">Failure: {payload[1].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis
                        dataKey="name"
                        stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? '#334155' : '#f1f5f9', opacity: 0.4 }} />
                    <Bar dataKey="success" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="failure" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AutomationSuccessChart;
