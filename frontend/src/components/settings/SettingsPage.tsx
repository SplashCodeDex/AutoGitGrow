import React, { useState, useEffect } from 'react';
import PageHeader from '../PageHeader';
import { useTheme } from '../../lib/state';
import { API_BASE_URL } from '../../lib/api';
import SonnerDemo from '../SonnerDemo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';

import { WhitelistItem } from '../../lib/types';

const SettingsPage = () => {
    const { isDarkMode } = useTheme();
    const [whitelistContent, setWhitelistContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchWhitelist = async () => {
            setIsLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const headers: HeadersInit = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const response = await fetch(`${API_BASE_URL}/settings/whitelist`, { headers });
                if (!response.ok) {
                    throw new Error(`Failed to fetch whitelist: ${response.statusText}`);
                }
                const data: WhitelistItem[] = await response.json();
                // Convert array of objects to newline-separated string
                const content = data.map((item) => item.username).join('\n');
                setWhitelistContent(content);
            } catch (err) {
                console.error("Error fetching whitelist:", err);
                setError('Error loading whitelist content.');
                setWhitelistContent('');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWhitelist();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}/settings/whitelist`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ content: whitelistContent }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save whitelist: ${response.statusText}`);
            }
            alert('Whitelist saved successfully!');
            // Re-fetch to ensure sync
            const fetchResponse = await fetch(`${API_BASE_URL}/settings/whitelist`, { headers });
            if (fetchResponse.ok) {
                const data: WhitelistItem[] = await fetchResponse.json();
                const content = data.map((item) => item.username).join('\n');
                setWhitelistContent(content);
            }
        } catch (err: any) {
            console.error("Error saving whitelist:", err);
            setError(err.message || 'Error saving whitelist content.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <PageHeader title="Settings" subtitle="Manage your AutoGitGrow configuration." />
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-slate-200/80 dark:border-slate-700 shadow-lg">
                    <CardHeader>
                        <CardTitle>Whitelist</CardTitle>
                        <CardDescription>
                            Usernames in this list will be protected from all bot actions (e.g., unfollowing). Add one username per line.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="w-full h-48 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out font-mono text-sm text-slate-700 dark:text-slate-300"
                            placeholder={isLoading ? "Loading whitelist..." : "username1\nanother_user\nimportant_account"}
                            aria-label="Whitelist editor"
                            value={whitelistContent}
                            onChange={(e) => setWhitelistContent(e.target.value)}
                            readOnly={isLoading}
                        />
                        {error && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <Button
                            variant="secondary"
                            onClick={() => setWhitelistContent('')}
                            disabled={isLoading || isSaving}
                        >
                            Clear
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="border-slate-200/80 dark:border-slate-700 shadow-lg">
                    <CardHeader>
                        <CardTitle>UI Components</CardTitle>
                        <CardDescription>
                            Test and verify new UI components.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-start">
                            <SonnerDemo />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default SettingsPage;
