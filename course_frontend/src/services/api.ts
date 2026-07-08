const API_BASE_URL = 'http://127.0.0.1:8000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export const getTokens = () => {
  const access = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  return { access, refresh };
};

export const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem('access_token', access);
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access) {
        setTokens(data.access);
        return data.access;
      }
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
  return null;
}

export async function request(path: string, options: RequestOptions = {}): Promise<any> {
  const { params, headers, ...initOptions } = options;
  
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      searchParams.append(key, String(val));
    });
    url += `?${searchParams.toString()}`;
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const { access } = getTokens();
  if (access) {
    defaultHeaders['Authorization'] = `Bearer ${access}`;
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  const response = await fetch(url, {
    ...initOptions,
    headers: mergedHeaders,
  });

  // Handle unauthorized (401)
  if (response.status === 401) {
    const { refresh } = getTokens();
    if (!refresh) {
      // No refresh token, clear and fail
      clearTokens();
      throw new Error('Unauthorized');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      const newAccess = await refreshAccessToken();
      isRefreshing = false;

      if (newAccess) {
        onRefreshed(newAccess);
      } else {
        clearTokens();
        // Force redirect to login or dispatch event
        window.dispatchEvent(new Event('auth-logout'));
        throw new Error('Session expired');
      }
    }

    // Wait for the token refresh to finish if another request triggered it
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh(async (token: string) => {
        try {
          const retryHeaders = {
            ...mergedHeaders,
            'Authorization': `Bearer ${token}`,
          };
          const retryResponse = await fetch(url, {
            ...initOptions,
            headers: retryHeaders,
          });
          if (!retryResponse.ok) {
            const errData = await retryResponse.json().catch(() => ({}));
            reject(new Error(errData.detail || 'Request failed after refresh'));
          } else {
            resolve(await retryResponse.json().catch(() => ({})));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Request failed with status ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (path: string, body?: any, options?: RequestOptions) => request(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string, options?: RequestOptions) => request(path, { ...options, method: 'DELETE' }),
};
export default api;
