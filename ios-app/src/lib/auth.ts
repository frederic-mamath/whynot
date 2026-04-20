import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "popup_auth_token";

export function getToken(): string | null {
  try {
    return SecureStore.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
