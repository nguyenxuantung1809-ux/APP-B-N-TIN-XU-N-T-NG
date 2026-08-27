import type { StoredLayoutLibrary } from '../types/bulletinLayout';

const DATABASE_NAME = 'vietinbank-fx-bulletin-studio';
const DATABASE_VERSION = 1;
const STORE_NAME = 'layout-library';
const LIBRARY_RECORD_KEY = 'active-library';

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener('error', () => reject(request.error), { once: true });
  });
}

async function openDatabase() {
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.addEventListener('upgradeneeded', () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
  }, { once: true });
  return requestResult(request);
}

export async function loadStoredLayoutLibrary() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    return await requestResult(transaction.objectStore(STORE_NAME).get(LIBRARY_RECORD_KEY)) as StoredLayoutLibrary | undefined;
  } finally {
    database.close();
  }
}

export async function saveStoredLayoutLibrary(library: StoredLayoutLibrary) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(library, LIBRARY_RECORD_KEY);
    await new Promise<void>((resolve, reject) => {
      transaction.addEventListener('complete', () => resolve(), { once: true });
      transaction.addEventListener('abort', () => reject(transaction.error), { once: true });
      transaction.addEventListener('error', () => reject(transaction.error), { once: true });
    });
  } finally {
    database.close();
  }
}
