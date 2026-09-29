import type { Credentials, GreenApiNotification, InstanceStateResponse, SendMessageResponse } from '../types';

const API_URL = import.meta.env.VITE_GREEN_API_URL || 'https://api.green-api.com';

function endpoint(credentials: Credentials, method: string): string {
  return `${API_URL}/waInstance${encodeURIComponent(
    credentials.idInstance
  )}/${method}/${encodeURIComponent(credentials.apiTokenInstance)}`;
}

export const checkAccount = async (credentials: Credentials, phoneNumber: string) => {
  const res = await fetch(endpoint(credentials, 'checkAccount'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  });
  if (!res.ok) throw new Error('Пользователь не найден');
  return res.json();
};

export const getContactInfo = async (credentials: Credentials, chatId: string) => {
  const res = await fetch(endpoint(credentials, 'getContactInfo'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId }),
  });
  if (!res.ok) throw new Error('Ошибка получения контакта');
  return res.json();
};

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `GREEN-API HTTP ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function getStateInstance(credentials: Credentials): Promise<InstanceStateResponse> {
  const response = await fetch(endpoint(credentials, 'getStateInstance'), { method: 'GET' });
  return parseResponse<InstanceStateResponse>(response);
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string
): Promise<SendMessageResponse> {
  const response = await fetch(endpoint(credentials, 'sendMessage'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatId,
      message,
    }),
  });

  return parseResponse<SendMessageResponse>(response);
}

export async function receiveNotification(
  credentials: Credentials,
  signal?: AbortSignal
): Promise<GreenApiNotification | null> {
  const url = `${endpoint(credentials, 'receiveNotification')}?receiveTimeout=60`;

  const response = await fetch(url, { method: 'GET', signal });

  // 500/502/504 — штатный таймаут long polling, а не ошибка.
  if (response.status === 500 || response.status === 502 || response.status === 504) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GREEN-API HTTP ${response.status}`);
  }

  // 200 с пустым телом — тоже «нет сообщений».
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as GreenApiNotification;
  } catch {
    return null;
  }
}

export async function deleteNotification(credentials: Credentials, receiptId: number): Promise<void> {
  const response = await fetch(`${endpoint(credentials, 'deleteNotification')}/${receiptId}`, {
    method: 'DELETE',
  });

  await parseResponse<{ result?: boolean }>(response);
}
