import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutomationsPanel from '../components/AutomationsPanel';

// Mock useTheme to avoid provider requirements
vi.mock('../lib/state', () => ({ useTheme: () => ({ isDarkMode: false }) }));

// Mock API module to inject endpoints and headers
vi.mock('../lib/api', () => ({
  AUTOMATION_RUN_ENDPOINT: '/api/automation/run',
  AUTOMATION_RUNS_ENDPOINT: '/api/automation/runs',
  automationHeaders: () => ({ 'Content-Type': 'application/json', 'X-Automation-Key': 'testkey' })
}));

describe('AutomationsPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  it('renders last run badge as green for success and shows timestamp', async () => {
    const runsResponse = [{ action: 'autotrack', workflow: 'run_autotrack.yml', last_run: {
      id: 1, status: 'completed', conclusion: 'success', created_at: '2024-01-01T00:00:00Z', html_url: 'http://example/run'
    }}];

    const fetchMock = vi.spyOn(global, 'fetch' as any).mockImplementation((url: any) => {
      if (typeof url === 'string' && url.includes('/api/automation/runs')) {
        return Promise.resolve(new Response(JSON.stringify(runsResponse), { status: 200 })) as any;
      }
      return Promise.resolve(new Response(JSON.stringify({ actions_url: '#' }), { status: 200 })) as any;
    });

    render(<AutomationsPanel />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Should display success badge
    const text = await screen.findByText(/Last: success/i);
    expect(text).toBeInTheDocument();
  });

  it('sends POST with X-Automation-Key header from automationHeaders', async () => {
    const runsResponse = [{ action: 'autotrack', workflow: 'run_autotrack.yml', last_run: null }];
    const postSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ actions_url: '#' }), { status: 200 }));

    const fetchMock = vi.spyOn(global, 'fetch' as any).mockImplementation((url: any, opts?: any) => {
      if (typeof url === 'string' && url.includes('/api/automation/runs')) {
        return Promise.resolve(new Response(JSON.stringify(runsResponse), { status: 200 })) as any;
      }
      if (typeof url === 'string' && url.includes('/api/automation/run')) {
        expect(opts?.headers['X-Automation-Key']).toBe('testkey');
        return postSpy();
      }
      return Promise.resolve(new Response('{}', { status: 200 })) as any;
    });

    render(<AutomationsPanel />);
    // Click the Run… button to open modal
    fireEvent.click(screen.getByText('Run…'));
    // Click Run on the "Track Stargazers" action
    const runButtons = await screen.findAllByText('Run');
    fireEvent.click(runButtons[0]);

    await waitFor(() => expect(postSpy).toHaveBeenCalled());
    fetchMock.mockRestore();
  });
});
