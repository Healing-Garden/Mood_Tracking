import type { User } from '../types/user';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

export const storage = {
  getAccessToken: (): string | null =>
    localStorage.getItem(ACCESS_TOKEN_KEY),

  setAccessToken: (token: string): void =>
    localStorage.setItem(ACCESS_TOKEN_KEY, token),

  removeAccessToken: (): void =>
    localStorage.removeItem(ACCESS_TOKEN_KEY),

  getUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  setUser: (user: User): void =>
    localStorage.setItem(USER_KEY, JSON.stringify(user)),

  removeUser: (): void =>
    localStorage.removeItem(USER_KEY),

  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
