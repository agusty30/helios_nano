const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export function backendUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}
