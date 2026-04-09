'use client';

import axios from 'axios';
import {
  createFieldLead,
  submitMeetingFeedback,
  type MeetingFeedbackPayload,
} from '@/features/field/api';

const DB_NAME = 'mandiplus-field-offline-db';
const STORE_NAME = 'requestQueue';
const DB_VERSION = 1;
const QUEUE_EVENT = 'mandiplus-offline-queue-change';
const OFFLINE_SAVE_EVENT = 'mandiplus-offline-save';

type QueuedLeadRequest = {
  id: string;
  type: 'create_lead';
  createdAt: string;
  payload: {
    form: {
      businessName: string;
      customerName: string;
      businessAddress: string;
      mobileNumber: string;
      businessType: string;
    };
    boardPhoto?: {
      blob: Blob;
      name: string;
      type: string;
    };
  };
};

type QueuedFeedbackRequest = {
  id: string;
  type: 'meeting_feedback';
  createdAt: string;
  payload: {
    appointmentId: string;
    feedback: MeetingFeedbackPayload;
  };
};

type QueuedRequest = QueuedLeadRequest | QueuedFeedbackRequest;

function emitQueueChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
}

function emitOfflineSaved() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OFFLINE_SAVE_EVENT));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open offline database'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let settled = false;
    let handlerResult: T;

    tx.oncomplete = () => {
      if (settled) return;
      settled = true;
      db.close();
      resolve(handlerResult);
    };

    tx.onerror = () => {
      if (settled) return;
      settled = true;
      db.close();
      reject(tx.error || new Error('Offline queue transaction failed'));
    };

    tx.onabort = () => {
      if (settled) return;
      settled = true;
      db.close();
      reject(tx.error || new Error('Offline queue transaction aborted'));
    };

    Promise.resolve(handler(store))
      .then((result) => {
        handlerResult = result;
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        tx.abort();
        db.close();
        reject(error);
      });
  });
}

function requestToPromise<T = void>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function queueLeadCreation(
  form: QueuedLeadRequest['payload']['form'],
  boardPhoto: File | null,
) {
  const request: QueuedLeadRequest = {
    id: makeId('lead'),
    type: 'create_lead',
    createdAt: new Date().toISOString(),
    payload: {
      form,
      ...(boardPhoto
        ? {
            boardPhoto: {
              blob: boardPhoto,
              name: boardPhoto.name,
              type: boardPhoto.type,
            },
          }
        : {}),
    },
  };

  await withStore('readwrite', async (store) => {
    await requestToPromise(store.put(request));
  });

  emitQueueChange();
  emitOfflineSaved();
}

export async function queueMeetingFeedback(
  appointmentId: string,
  feedback: MeetingFeedbackPayload,
) {
  const request: QueuedFeedbackRequest = {
    id: makeId('feedback'),
    type: 'meeting_feedback',
    createdAt: new Date().toISOString(),
    payload: {
      appointmentId,
      feedback,
    },
  };

  await withStore('readwrite', async (store) => {
    await requestToPromise(store.put(request));
  });

  emitQueueChange();
  emitOfflineSaved();
}

export async function getQueuedRequestCount() {
  return withStore('readonly', async (store) => requestToPromise<number>(store.count()));
}

async function getQueuedRequests() {
  const requests = await withStore('readonly', async (store) =>
    requestToPromise<QueuedRequest[]>(store.getAll() as IDBRequest<QueuedRequest[]>),
  );

  return requests.sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

async function removeQueuedRequest(id: string) {
  await withStore('readwrite', async (store) => {
    await requestToPromise(store.delete(id));
  });
  emitQueueChange();
}

function rebuildLeadFormData(payload: QueuedLeadRequest['payload']) {
  const formData = new FormData();
  Object.entries(payload.form).forEach(([key, value]) => formData.append(key, value));

  if (payload.boardPhoto) {
    const file = new File([payload.boardPhoto.blob], payload.boardPhoto.name, {
      type: payload.boardPhoto.type,
    });
    formData.append('boardPhoto', file);
  }

  return formData;
}

export function isOfflineCapableError(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return axios.isAxiosError(error) && (
    error.code === 'ERR_NETWORK' ||
    !error.response
  );
}

export async function syncOfflineQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, remainingCount: await getQueuedRequestCount() };
  }

  const requests = await getQueuedRequests();
  let syncedCount = 0;

  for (const request of requests) {
    try {
      if (request.type === 'create_lead') {
        await createFieldLead(rebuildLeadFormData(request.payload));
      } else {
        await submitMeetingFeedback(
          request.payload.appointmentId,
          request.payload.feedback,
        );
      }

      await removeQueuedRequest(request.id);
      syncedCount += 1;
    } catch (error: unknown) {
      if (isOfflineCapableError(error)) {
        break;
      }

      throw error;
    }
  }

  return { syncedCount, remainingCount: await getQueuedRequestCount() };
}

export function subscribeToOfflineQueue(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(QUEUE_EVENT, listener);
  return () => window.removeEventListener(QUEUE_EVENT, listener);
}

export function subscribeToOfflineSaved(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(OFFLINE_SAVE_EVENT, listener);
  return () => window.removeEventListener(OFFLINE_SAVE_EVENT, listener);
}
