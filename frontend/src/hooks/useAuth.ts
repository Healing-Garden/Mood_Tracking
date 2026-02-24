import { useState } from 'react';
import { storage } from '../utils/storage';
import type { User } from '../types/user';

export function useAuth() {
  const [user] = useState<User | null>(() => {
    return storage.getUser();
  });

  return {
    user,
    loading: false,
  };
}
