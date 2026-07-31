import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

export const login = async (credentials: LoginCredentials): Promise<void> => {
  // 1. Initialize the CSRF cookie session with Laravel
  await api.get('/sanctum/csrf-cookie');

  // 2. Send the login request (Laravel handles cookie attachment automatically)
  await api.post('/login', credentials);
};

export const logout = async (): Promise<void> => {
  await api.post('/logout');
};

export const getUser = async () => {
  const response = await api.get('/user');
  return response.data;
};