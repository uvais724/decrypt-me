import axios from 'axios';
import { supabase } from './supabaseClient';

const apiClient = axios.create({
  baseURL: '/api'
});

// Attach Supabase access token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
