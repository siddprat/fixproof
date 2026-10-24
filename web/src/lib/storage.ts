// localStorage can throw (private mode, blocked site data, previews). Never let it crash the app.

export const CASE_KEY = "fixproof.caseId";

export function storageGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function storageSet(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
}

export function storageRemove(key: string): void {
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}
