/**
 * Local persistence (IndexedDB). Projects are JSON; media originals are Blobs.
 * The surface is deliberately small (get/put/delete/list on named stores) so a Supabase/cloud
 * implementation can replace it later without touching the editor.
 */

const DB_NAME = "collage-studio";
const VERSION = 1;
type StoreName = "projects" | "assets" | "blobs" | "kv";

let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of ["projects", "assets", "blobs", "kv"] as StoreName[]) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        t.oncomplete = () => resolve(req.result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export const dbGet = <T>(store: StoreName, key: string) => tx<T | undefined>(store, "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);
export const dbPut = (store: StoreName, key: string, value: unknown) => tx(store, "readwrite", (s) => s.put(value, key)).then(() => undefined);
export const dbDelete = (store: StoreName, key: string) => tx(store, "readwrite", (s) => s.delete(key)).then(() => undefined);
export const dbAll = <T>(store: StoreName) => tx<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
export const dbKeys = (store: StoreName) => tx<IDBValidKey[]>(store, "readonly", (s) => s.getAllKeys());

export async function storageEstimate(): Promise<{ used: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    return e ? { used: e.usage ?? 0, quota: e.quota ?? 0 } : null;
  } catch {
    return null;
  }
}
