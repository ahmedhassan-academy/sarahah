import { create } from 'zustand';
import api from '../api/client';

export const useAuth = create((set, get) => ({
  user: null,
  loaded: false,

  setToken(token) {
    localStorage.setItem('sarahah_token', token);
  },

  async loadMe() {
    const token = localStorage.getItem('sarahah_token');
    if (!token) {
      set({ user: null, loaded: true });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loaded: true });
    } catch {
      localStorage.removeItem('sarahah_token');
      set({ user: null, loaded: true });
    }
  },

  async login(identifier, password) {
    const { data } = await api.post('/auth/login', { identifier, password });
    get().setToken(data.token);
    set({ user: data.user, loaded: true });
    return data.user;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    get().setToken(data.token);
    set({ user: data.user, loaded: true });
    return data.user;
  },

  logout() {
    localStorage.removeItem('sarahah_token');
    set({ user: null });
  },

  setUser(user) {
    set({ user });
  },
}));
