import * as SecureStore from 'expo-secure-store';
import { DeviceEventEmitter } from 'react-native';
import { EXPO_PUBLIC_API_URL } from '../config/env';

async function getToken() {
  return await SecureStore.getItemAsync('access_token');
}

async function getRefreshToken() {
  return await SecureStore.getItemAsync('refresh_token');
}

async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync('access_token', access);
  await SecureStore.setItemAsync('refresh_token', refresh);
}

async function clearTokens() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
}

async function request<T>(endpoint: string, options: RequestInit & { isFormData?: boolean } = {}): Promise<T> {
  const url = `${EXPO_PUBLIC_API_URL}${endpoint}`;
  let token = await getToken();

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!options.isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, config);

    if (response.status === 401 && token) {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${EXPO_PUBLIC_API_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshResponse.ok) {
            const { access } = await refreshResponse.json();
            await SecureStore.setItemAsync('access_token', access);
            headers['Authorization'] = `Bearer ${access}`;
            
            // Retry original request
            response = await fetch(url, { ...config, headers });
          } else {
            await clearTokens();
            DeviceEventEmitter.emit('auth:logout');
          }
        } catch (err) {
          await clearTokens();
          DeviceEventEmitter.emit('auth:logout');
        }
      } else {
        await clearTokens();
        DeviceEventEmitter.emit('auth:logout');
      }
    }

    if (response.status === 204) return {} as T;

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || response.statusText);
    }

    return await response.json();
  } catch (error) {
    // console.warn(`Fetch failed for ${endpoint}`, error); // Removed to avoid noisy LogBox on expected errors like 401
    throw error;
  }
}


export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  postFormData: <T>(endpoint: string, body: FormData) => request<T>(endpoint, { method: 'POST', body, isFormData: true }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  patchFormData: <T>(endpoint: string, body: FormData) => request<T>(endpoint, { method: 'PATCH', body, isFormData: true }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  clearTokens,
  setTokens,
  getTokens: getToken
};

export const get = apiClient.get;
export const post = apiClient.post;
export const postFormData = apiClient.postFormData;
export const put = apiClient.put;
export const patch = apiClient.patch;
export const patchFormData = apiClient.patchFormData;
export const del = apiClient.delete;
