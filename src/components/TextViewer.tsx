import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';

const TextViewer = ({ file, title }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch(file)
            .then(res => res.ok ? res.text() : Promise.reject(`Failed to load ${file}`))
            .then(text => {
                setContent(text);
            })
            .catch(err => {
                console.error("Error fetching file:", err);
                setContent('Error loading content.');
            })
            .finally(() => setIsLoading(false));
    }, [file]);

    return (
        <>
            <PageHeader title={title} subtitle={`Content of ${file}`} />
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200/80 dark:border-slate-700">
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                ) : <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm font-mono">{content}</pre>}
            </div>
        </>
    )
}

export default TextViewer;