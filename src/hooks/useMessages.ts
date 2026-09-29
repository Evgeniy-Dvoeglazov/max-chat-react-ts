import { useEffect } from 'react';
import { deleteNotification, receiveNotification } from '../api/greenApi';
import type { Credentials, Message } from '../types';

interface UseMessagesOptions {
  credentials: Credentials | null;
  onMessage: (message: Message) => void;
  onChatInfo: (chatId: string, title: string, lastMessage?: string, timestamp?: number) => void;
  onError: (message: string) => void;
}

const EMPTY_NOTIFICATION_DELAY = 1000;
const ERROR_RETRY_DELAY = 3000;

export function useMessages({ credentials, onMessage, onChatInfo, onError }: UseMessagesOptions) {
  useEffect(() => {
    if (!credentials) return;

    const controller = new AbortController();
    let stopped = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const receiveLoop = async () => {
      while (!stopped && !controller.signal.aborted) {
        try {
          const notification = await receiveNotification(credentials, controller.signal);

          if (stopped || controller.signal.aborted) break;

          // Если ответ пустой — просто пауза и следующая итерация.
          if (!notification) {
            await sleep(EMPTY_NOTIFICATION_DELAY);
            continue;
          }

          const webhook = notification.body;

          // Обрабатываем только входящие текстовые сообщения.
          if (webhook.typeWebhook === 'incomingMessageReceived' && webhook.messageData?.typeMessage === 'textMessage') {
            const chatId = webhook.senderData?.chatId;
            const text = webhook.messageData.textMessageData?.textMessage;

            if (chatId && text) {
              // GREEN-API отдаёт timestamp в секундах, переводим в миллисекунды.
              const timestamp = (webhook.timestamp ?? Math.floor(Date.now() / 1000)) * 1000;

              const message: Message = {
                id: webhook.idMessage ?? `${notification.receiptId}-${timestamp}`,
                chatId,
                text,
                direction: 'incoming',
                timestamp,
              };

              onMessage(message);
              onChatInfo(chatId, webhook.senderData?.chatName || webhook.senderData?.senderName || '', text, timestamp);
            }
          }

          // Подтверждаем обработку — очередь не застрянет.
          await deleteNotification(credentials, notification.receiptId);
        } catch (error) {
          // Отмена через AbortController — выходим.
          if (error instanceof DOMException && error.name === 'AbortError') break;
          if (stopped || controller.signal.aborted) break;

          // Все остальные ошибки показываем и повторяем попытку.
          const message = error instanceof Error ? error.message : String(error);
          onError(message);
          await sleep(ERROR_RETRY_DELAY);
        }
      }
    };

    receiveLoop();

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [credentials, onChatInfo, onError, onMessage]);
}
