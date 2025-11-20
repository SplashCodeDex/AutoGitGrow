import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const ReciprocityCard = ({ username, data }) => {
    return (
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200/80 dark:border-slate-700">
            <CardHeader className="p-3 pb-0">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-white">
                    <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-500 dark:text-indigo-400">
                        {username}
                    </a>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
                <div>
                    <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-1">Starred By You:</h4>
                    <ul className="text-green-500 space-y-0.5">
                        {data.starred_by.map((repo, index) => (
                            <li key={index} className="text-xs truncate">{repo}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-1">Starred Back:</h4>
                    <ul className="text-blue-500 space-y-0.5">
                        {data.starred_back.map((repo, index) => (
                            <li key={index} className="text-xs">{repo}</li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

export default ReciprocityCard;
