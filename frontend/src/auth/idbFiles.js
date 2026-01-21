// src/auth/idbFiles.js
const DB_NAME = "project_files_db";
const DB_VERSION = 1;
const STORE_NAME = "files";

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `f_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB не е наличен в този браузър/режим."));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
  });
}

export async function saveFileToIDB(file) {
  const db = await openDB();
  const id = genId();

  // file is a File object (png/jpg)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put({
      id,
      name: file.name,
      type: file.type,
      blob: file, // File is storable in IndexedDB
      createdAt: new Date().toISOString(),
    });

    tx.oncomplete = () => resolve({ id, name: file.name, type: file.type });
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

export async function getFileFromIDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error("IndexedDB get failed"));
  });
}
