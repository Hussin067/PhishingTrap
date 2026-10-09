/**
 * adminApi.js
 *
 * Network layer for the admin portal. Separate from api.js (employee side).
 * The admin token lives in sessionStorage (cleared when the tab closes) and is
 * sent as `Authorization: Bearer <token>`. A 401 clears the session and sends
 * the user back to the admin login page.
 */
import { API_BASE_URL } from "./api";

const TOKEN_KEY = "adminToken";
const EMAIL_KEY = "adminEmail";
const EXPIRES_KEY = "adminExpiresAt";

export function saveAdminSession({ access_token, email, expires_at }) {
  sessionStorage.setItem(TOKEN_KEY, access_token);
  sessionStorage.setItem(EMAIL_KEY, email);
  sessionStorage.setItem(EXPIRES_KEY, String(expires_at));
}

export function clearAdminSession() {
  [TOKEN_KEY, EMAIL_KEY, EXPIRES_KEY].forEach((key) => sessionStorage.removeItem(key));
}

export function getAdminSession() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(sessionStorage.getItem(EXPIRES_KEY) || 0);
  if (!token || expiresAt * 1000 <= Date.now()) return null;
  return { token, email: sessionStorage.getItem(EMAIL_KEY) };
}

async function adminRequest(path, options = {}, { authenticated = true } = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  if (authenticated) {
    const session = getAdminSession();
    if (!session) {
      window.location.assign("/login");
      throw new Error("Not signed in");
    }
    headers.Authorization = `Bearer ${session.token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (networkError) {
    throw new Error(`Cannot reach the server (${networkError.message})`, { cause: networkError });
  }

  let data = null;
  if ((response.headers.get("content-type") || "").includes("application/json")) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      clearAdminSession();
      window.location.assign("/login");
    }
    let detail = data?.detail || response.statusText;
    if (Array.isArray(detail)) detail = detail.map((d) => d.msg).join("; ");
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }
  return data;
}

const flag = (includeSynthetic) => `include_synthetic=${includeSynthetic ? "true" : "false"}`;

export const adminLogin = (email, password) =>
  adminRequest(
    "/admin/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    { authenticated: false }
  );

export const getOverview = (inc) => adminRequest(`/admin/overview?${flag(inc)}`);
export const getAdminEmployees = (inc) => adminRequest(`/admin/employees?${flag(inc)}`);
export const getEmployeeDetail = (id, inc) => adminRequest(`/admin/employees/${id}?${flag(inc)}`);
export const getWeaknessMatrix = (inc) => adminRequest(`/admin/weakness-matrix?${flag(inc)}`);
export const getAdminCampaigns = (inc) => adminRequest(`/admin/campaigns?${flag(inc)}`);
export const getCampaignDetail = (id) => adminRequest(`/admin/campaigns/${id}`);
export const runCampaign = (body) =>
  adminRequest("/admin/campaigns/run", { method: "POST", body: JSON.stringify(body) });

/** Existing, unauthenticated email preview endpoint (opened in a new tab). */
export const previewUrl = (simulationId) => `${API_BASE_URL}/simulations/${simulationId}/preview`;
