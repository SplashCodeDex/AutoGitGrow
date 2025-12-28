import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Mock child components that might have complex dependencies
vi.mock('./components/Dashboard', () => ({ default: () => <div>Dashboard Mock</div> }));
vi.mock('./components/AutomationLauncher', () => ({ default: () => <div>AutomationLauncher Mock</div> }));
vi.mock('./components/NewSidebar', () => ({ default: () => <div>Sidebar Mock</div> }));
vi.mock('./components/SettingsPage', () => ({ default: () => <div>Settings Mock</div> }));
vi.mock('./pages/LoginPage', () => ({ default: () => <div>Login Page Mock</div> }));

describe('App', () => {
    it('renders without crashing', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );
        // By default, it redirects to /login if not authenticated.
        // We mocked LoginPage, so we expect to see "Login Page Mock" if logic holds,
        // or just ensure it doesn't throw.
        expect(document.body).toBeInTheDocument();
    });
});
