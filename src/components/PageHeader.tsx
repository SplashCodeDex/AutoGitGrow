import React from 'react';

const PageHeader = ({ title, subtitle }) => (
    <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
);

export default PageHeader;