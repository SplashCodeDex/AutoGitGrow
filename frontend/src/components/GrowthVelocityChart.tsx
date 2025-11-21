import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface GrowthData {
    date: string;
    followers: number;
    following: number;
}

interface GrowthVelocityChartProps {
    data: GrowthData[];
}

const GrowthVelocityChart: React.FC<GrowthVelocityChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                No growth data available yet.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Growth Velocity
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Follower growth over time</p>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: '#f3f4f6',
                            }}
                            itemStyle={{ color: '#818cf8' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="followers"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorFollowers)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default GrowthVelocityChart;
