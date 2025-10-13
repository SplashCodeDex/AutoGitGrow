import React from 'react';

const PageHeader = ({ title, subtitle }) => (
    <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-wide">{title}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">{subtitle}</p>
    </div>
);

export default PageHeader;