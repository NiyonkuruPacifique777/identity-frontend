const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function announceProfileUpdate(profile) {
  window.dispatchEvent(new CustomEvent('identity:profile-updated', { detail: profile }));
}

async function send(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiError('The server returned an invalid response.', response.status);
    }
  }

  return { response, body };
}

let refreshRequest;

async function refreshSession() {
  refreshRequest ??= send('/auth/refresh', { method: 'POST' })
    .finally(() => { refreshRequest = null; });
  const { response, body } = await refreshRequest;
  if (!response.ok) throw new ApiError(body?.error || 'Your session has expired.', response.status);
}

async function request(path, options = {}) {
  let result = await send(path, options);
  if (result.response.status === 401 && !path.startsWith('/auth/')) {
    try {
      await refreshSession();
      result = await send(path, options);
    } catch {
      throw new ApiError(result.body?.error || 'Please sign in to continue.', 401);
    }
  }

  if (!result.response.ok) {
    throw new ApiError(result.body?.error || 'The request could not be completed.', result.response.status);
  }
  return result.body;
}

const post = (path, body) => request(path, {
  method: 'POST',
  ...(body === undefined ? {} : { body: JSON.stringify(body) })
});

export const api = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (email, password) => post('/auth/register', { email, password }),
  logout: () => post('/auth/logout'),
  getMyProfile: async () => (await request('/profiles/me')).profile,
  updateMyProfile: async profile => (await request('/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(profile)
  })).profile,
  publishMyProfile: () => post('/profiles/me/publish'),
  unpublishMyProfile: () => post('/profiles/me/unpublish'),
  getPublicProfile: async slug => (await request(`/profiles/${encodeURIComponent(slug)}`)).profile,
  getAccount: async () => (await request('/auth/me')).user,
  updateAccount: body => request('/auth/account', { method: 'PUT', body: JSON.stringify(body) }),
  updatePassword: body => request('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: body => request('/auth/account', { method: 'DELETE', body: JSON.stringify(body) }),
  getResumes: async () => (await request('/resumes')).resumes,
  getResume: async id => (await request(`/resumes/${encodeURIComponent(id)}`)).resume,
  createResume: async resume => (await request('/resumes', { method: 'POST', body: JSON.stringify(resume) })).resume,
  updateResume: async (id, resume) => (await request(`/resumes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(resume) })).resume,
  deleteResume: id => request(`/resumes/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
