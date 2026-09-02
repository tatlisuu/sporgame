import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'sporgame_access_token';
const REFRESH_TOKEN_KEY = 'sporgame_refresh_token';

let memoryStorage: Record<string, string> = {};

async function isStorageAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return await SecureStore.isAvailableAsync();
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  if (await isStorageAvailable()) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    memoryStorage[ACCESS_TOKEN_KEY] = accessToken;
    memoryStorage[REFRESH_TOKEN_KEY] = refreshToken;
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (await isStorageAvailable()) {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  }
  return memoryStorage[ACCESS_TOKEN_KEY] || null;
}

export async function getRefreshToken(): Promise<string | null> {
  if (await isStorageAvailable()) {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }
  return memoryStorage[REFRESH_TOKEN_KEY] || null;
}

export async function clearTokens(): Promise<void> {
  if (await isStorageAvailable()) {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } else {
    delete memoryStorage[ACCESS_TOKEN_KEY];
    delete memoryStorage[REFRESH_TOKEN_KEY];
  }
}
