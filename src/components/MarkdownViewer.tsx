import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import PageHeader from './PageHeader';

const proseStyles = (isDarkMode) => `
  .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { 
    color: ${isDarkMode ? '#fff' : '#111827'}; 
    border-bottom-color: ${isDarkMode ? '#4b5563' : '#e5e7eb'}; 
    padding-bottom: 0.3em; 
    margin-top: 1.5em; 
    margin-bottom: 1em; 
  }
  .prose a { color: #818cf8; text-decoration: none; }
  .prose a:hover { text-decoration: underline; }
  .prose code { 
    background-color: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
    padding: 0.2em 0.4em; 
    margin: 0; 
    font-size: 85%; 
    border-radius: 6px; 
    color: ${isDarkMode ? '#e5e7eb' : '#111827'}; 
  }
  .prose pre { 
    background-color: ${isDarkMode ? '#1f2937' : '#f9fafb'}; 
    padding: 1em; 
    overflow-x: auto; 
    border-radius: 8px; 
  }
  .prose pre code { background-color: transparent; padding: 0; }
  .prose blockquote { 
    border-left-color: ${isDarkMode ? '#4b5563' : '#e5e7eb'}; 
    color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
  }
  .prose ul { list-style-type: disc; }
  .prose li { margin-top: 0.5em; margin-bottom: 0.5em; }
  .prose p, .prose li { color: ${isDarkMode ? '#d1d5db' : '#374151'}; }
  .prose strong { color: ${isDarkMode ? '#fff' : '#000'}; }
`;

const MarkdownViewer = ({ file, title, isDarkMode }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(file)
      .then(res => res.ok ? res.text() : Promise.reject(`Failed to load ${file}`))
      .then(text => {
        setContent(marked(text));
      })
      .catch(err => {
        console.error("Error fetching file:", err);
        setContent('<p class="text-red-400">Error loading content.</p>');
      })
      .finally(() => setIsLoading(false));
  }, [file]);
  
  return (
    <>
      <style>{proseStyles(isDarkMode)}</style>
      <PageHeader title={title} subtitle={`Content of ${file}`} />
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg prose max-w-none border border-slate-200/80 dark:border-slate-700">
        {isLoading ? (
             <div className="space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
            </div>
        ) : <div dangerouslySetInnerHTML={{ __html: content }} />}
      </div>
    </>
  )
}

export default MarkdownViewer;