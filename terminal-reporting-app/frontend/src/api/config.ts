export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export async function simulateNetwork<T>(value: T): Promise<T> {
  await delay();
  return value;
}
