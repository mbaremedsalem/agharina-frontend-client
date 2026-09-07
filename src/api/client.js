export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
export const TOKEN_STORAGE_KEY = "agharina_client_token";

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function buildQuery(params) {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (!entries.length) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function messageFromErrorPayload(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data)) return data.join(" ");
  const parts = Object.entries(data).map(([key, value]) => {
    const text = Array.isArray(value) ? value.join(" ") : value;
    return key === "non_field_errors" ? text : `${key}: ${text}`;
  });
  return parts.join(" | ");
}

async function rawRequest(url, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;

  let payload = body;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers, body: payload });

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(messageFromErrorPayload(data) || `Erreur ${res.status}`, res.status, data);
  }
  return data;
}

/** GET simple (ressource unique, reponse non paginee). */
async function get(path, params) {
  return rawRequest(`${API_URL}${path}${buildQuery(params)}`);
}

/** GET qui suit la pagination DRF (`next`) et rend un tableau complet. */
async function list(path, params) {
  let url = `${API_URL}${path}${buildQuery(params)}`;
  let results = [];
  let guard = 0;
  while (url && guard < 50) {
    const data = await rawRequest(url);
    if (Array.isArray(data)) {
      results = results.concat(data);
      break;
    }
    results = results.concat(data?.results ?? []);
    url = data?.next ?? null;
    guard += 1;
  }
  return results;
}

/** GET paginee (une page a la fois) : renvoie {results, count, next, previous}. */
async function page(path, params) {
  const data = await rawRequest(`${API_URL}${path}${buildQuery(params)}`);
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    count: data?.count ?? 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}

function post(path, body) {
  return rawRequest(`${API_URL}${path}`, { method: "POST", body });
}

function patch(path, body) {
  return rawRequest(`${API_URL}${path}`, { method: "PATCH", body });
}

export const api = { get, list, page, post, patch };
export { ApiError };
