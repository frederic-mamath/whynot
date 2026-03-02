import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "whynot_auth_token";

/**
 * Get the stored JWT token.
 * Uses expo-secure-store (encrypted on-device storage).
 *
 * NOTE: SecureStore is synchronous on native, returns string | null.
 */
export function getToken(): string | null {
  try {
    return SecureStore.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store the JWT token securely.
 */
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Remove the stored JWT token (logout).
 */
export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * Check if a token exists (quick auth check).
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}
