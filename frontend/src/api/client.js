import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((cfg) => {
  const userToken = localStorage.getItem('sarahah_token');
  if (userToken) {
    cfg.headers.Authorization = `Bearer ${userToken}`;
    return cfg;
  }
  const visitorToken = localStorage.getItem('sarahah_google_token');
  if (visitorToken) {
    cfg.headers.Authorization = `Bearer ${visitorToken}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        if (localStorage.getItem('sarahah_token')) {
          localStorage.removeItem('sarahah_token');
        } else if (localStorage.getItem('sarahah_google_token')) {
          localStorage.removeItem('sarahah_google_token');
          localStorage.removeItem('sarahah_google_profile');
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
