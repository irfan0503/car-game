const tokenKey = 'apexShiftToken';

export function getToken() {
  return sessionStorage.getItem(tokenKey);
}

export function clearToken() {
  sessionStorage.removeItem(tokenKey);
}

export async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'The server could not complete that request.');
  return payload;
}

export function saveToken(token) {
  sessionStorage.setItem(tokenKey, token);
}