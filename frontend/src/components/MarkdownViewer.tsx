import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import PageHeader from './PageHeader';
import { useTheme } from '../lib/state';
import { Card, CardContent } from './ui/card';

const proseStyles = (isDarkMode) => `
// ... (rest of the styles)
`;

const MarkdownViewer = ({ file, title }) => {
  const { isDarkMode } = useTheme();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(file)
      .then(res => res.ok ? res.text() : Promise.reject(`Failed to load ${file}`))
      .then(async text => {
        const parsed = await marked(text);
        setContent(parsed);
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
      <Card className="border-slate-200/80 dark:border-slate-700 shadow-lg">
        <CardContent className="p-8 prose max-w-none">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
            </div>
          ) : <div dangerouslySetInnerHTML={{ __html: content }} />}
        </CardContent>
      </Card>
    </>
  )
}

export default MarkdownViewer;
