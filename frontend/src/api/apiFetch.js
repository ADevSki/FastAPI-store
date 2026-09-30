import { refreshAccessToken } from "./auth";

const API_URL = "/api";

export async function apiFetch(path, options = {}) {
  let accessToken = localStorage.getItem("access_token");

  const headers = new Headers(options.headers || {});

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const newAccessToken = await refreshAccessToken();

  if (!newAccessToken) {
    return response;
  }

  const retryHeaders = new Headers(options.headers || {});
  retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: retryHeaders,
  });
}