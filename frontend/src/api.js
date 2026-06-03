import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api',
});

// Cache del token para no llamar a Supabase en cada request
let tokenCache = { value: null, expiresAt: 0 };

api.interceptors.request.use(async (config) => {
  const now = Date.now();
  if (!tokenCache.value || now > tokenCache.expiresAt) {
    const { data: { session } } = await supabase.auth.getSession();
    tokenCache = {
      value:     session?.access_token || null,
      expiresAt: now + 50_000, // 50 segundos (tokens duran 1 hora)
    };
  }
  if (tokenCache.value) {
    config.headers.Authorization = `Bearer ${tokenCache.value}`;
  }
  return config;
});

// Invalidar caché al cerrar sesión
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    tokenCache = { value: null, expiresAt: 0 };
  }
});

export default api;
