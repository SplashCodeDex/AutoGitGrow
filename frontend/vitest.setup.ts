import '@testing-library/jest-dom';

// Basic fetch mock; tests can override per case
if (!(global as any).fetch) {
  (global as any).fetch = async () => ({ ok: true, json: async () => ({}) }) as any;
}
