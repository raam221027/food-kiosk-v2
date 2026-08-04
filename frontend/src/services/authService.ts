import api, { apiRoot } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Shape returned by AuthController::userPayload on the Laravel side. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  /** First assigned Spatie role — what the SPA routes on. */
  role: string | null;
  roles: string[];
}

/** The API wraps single resources in a `data` envelope. */
const unwrap = (payload: unknown): AuthUser =>
  (payload as { data: AuthUser })?.data ?? (payload as AuthUser);

export const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
  // 1. Initialize the CSRF cookie session with Laravel. This route lives at the
  //    application root, so it goes through apiRoot — going through `api` would
  //    resolve to /api/sanctum/csrf-cookie and 404.
  await apiRoot.get('/sanctum/csrf-cookie');

  // 2. Send the login request (Laravel handles cookie attachment automatically)
  const response = await api.post('/login', credentials);
  return unwrap(response.data);
};

export const logout = async (): Promise<void> => {
  await api.post('/logout');
};

export const getUser = async (): Promise<AuthUser> => {
  const response = await api.get('/user');
  return unwrap(response.data);
};
