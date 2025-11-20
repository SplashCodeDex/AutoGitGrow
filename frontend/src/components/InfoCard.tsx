import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const InfoCard = ({ title, data }) => {
    return (
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200/80 dark:border-slate-700">
            <CardHeader className="p-3 pb-0">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-white">
                    <a href={data.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-500 dark:text-indigo-400">
                        {title}
                    </a>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
                {data.avatar_url && <img src={data.avatar_url} alt={`${title} avatar`} className="w-16 h-16 rounded-full mx-auto mb-2" />}
                {data.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{data.description}</p>}
                <div className="flex justify-between text-sm">
                    {data.followers && <span>Followers: {data.followers}</span>}
                    {data.stargazers_count && <span>Stars: {data.stargazers_count}</span>}
                </div>
            </CardContent>
        </Card>
    );
};

export default InfoCard;
