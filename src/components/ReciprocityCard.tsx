import React from 'react';

const ReciprocityCard = ({ username, data }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{username}</h3>
            <div>
                <h4 className="font-semibold">Starred By You:</h4>
                <ul>
                    {data.starred_by.map((repo, index) => (
                        <li key={index}>{repo}</li>
                    ))}
                </ul>
            </div>
            <div className="mt-4">
                <h4 className="font-semibold">Starred Back:</h4>
                <ul>
                    {data.starred_back.map((repo, index) => (
                        <li key={index}>{repo}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ReciprocityCard;
