import * as SecureStore from 'expo-secure-store';

/** Session storage on iOS (Keychain) and Android (Keystore). See storage.web.ts for web. */
export async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
