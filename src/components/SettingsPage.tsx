import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';

async function fetchTextFromGitHub(owner, repo, path, branch = null) {
    const refQuery = branch ? `?ref=${branch}` : '';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${refQuery}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AutoGitGrow-Dashboard' }
    });
    if (!response.ok) {
      if (response.status === 404) {
        // For a text file like whitelist, not existing is not a fatal error.
        return '';
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return atob(data.content);
}

const SettingsPage = ({ isDarkMode }) => {
    const [whitelistContent, setWhitelistContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const REPO_OWNER = 'SplashCodeDex';
        const REPO_NAME = 'AutoGitGrow';

        const fetchWhitelist = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch from the default branch by passing null for the branch parameter.
                const content = await fetchTextFromGitHub(REPO_OWNER, REPO_NAME, 'config/whitelist.txt', null);
                setWhitelistContent(content);
            } catch (err) {
                console.error("Error fetching whitelist:", err);
                setError('Error loading whitelist content. Please check your repository structure.');
                setWhitelistContent('');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWhitelist();
    }, []);

    return (
        <>
            <PageHeader title="Settings" subtitle="Manage your AutoGitGrow configuration." />
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto border border-slate-200/80 dark:border-slate-700">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Whitelist</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            Usernames in this list will be protected from all bot actions (e.g., unfollowing). Add one username per line.
                        </p>
                        <textarea
                            className="w-full h-48 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out font-mono text-sm text-slate-700 dark:text-slate-300"
                            placeholder={isLoading ? "Loading whitelist..." : "username1\nanother_user\nimportant_account"}
                            aria-label="Whitelist editor"
                            value={whitelistContent}
                            onChange={(e) => setWhitelistContent(e.target.value)}
                            readOnly={isLoading}
                        />
                        {error && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Note: Saving changes from this dashboard is not yet supported. Please edit <code>config/whitelist.txt</code> directly in your repository.
                        </p>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Actions</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                            Note: Interactive settings are coming soon! For now, please manage your configuration files directly in your repository.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button disabled className="px-6 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md cursor-not-allowed">
                                Cancel
                            </button>
                            <button disabled className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition cursor-not-allowed opacity-50">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPage;
