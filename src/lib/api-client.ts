import { ApiResponse } from "../../shared/types"
import { useAuthStore } from "@/hooks/use-auth-store";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const user = useAuthStore.getState().user;
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (user?.id) {
    headers.set('X-User-Id', user.id);
  }
  const res = await fetch(`${window.location.origin}${path}`, { ...init, headers });
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    const errorText = await res.text();
    // Throw a descriptive error for server-side issues
    throw new Error(`API request failed with status ${res.status}: ${errorText.substring(0, 200)}`);
  }
  if (!contentType || !contentType.includes('application/json')) {
    // Throw an error if the response is not JSON, preventing parsing errors
    throw new Error(`Expected JSON response from server, but received '${contentType}'.`);
  }
  const json = (await res.json()) as ApiResponse<T>
  if (!json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed due to an unknown API error');
  }
  return json.data
}