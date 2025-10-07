import React from 'react';

const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 border border-slate-200/80 dark:border-slate-700">
        <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-full animate-pulse h-12 w-12"></div>
        <div className="w-full space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
        </div>
    </div>
);

export default SkeletonCard;