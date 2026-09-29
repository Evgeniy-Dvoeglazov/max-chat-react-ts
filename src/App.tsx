import { useCallback, useEffect, useRef, useState } from 'react';
import type { Chat, Credentials, Message } from './types';
import { ChatPage } from './components/ChatPage/ChatPage';
import { NewChatModal } from './components/NewChatModal/NewChatModal';
import { AuthPage } from './components/AuthPage/AuthPage';
import { formatPhone, normalizePhone } from './utils/phone';
import { useMessages } from './hooks/useMessages';
import { checkAccount, getContactInfo, getStateInstance, sendMessage } from './api/greenApi';

const STORAGE_KEY = 'max-chat-credentials';

function loadCredentials(): Credentials | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Credentials) : null;
  } catch {
    return null;
  }
}

function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [createChatError, setCreateChatError] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Ref нужен, чтобы handleIncomingMessage не зависел от activeChatId.
  // Иначе useMessages будет перезапускать поллинг на каждое переключение чата.
  const activeChatIdRef = useRef<string | null>(null);

  const handleIncomingMessage = useCallback((message: Message) => {
    setChats((current) => {
      const chat = current.find((c) => c.id === message.chatId);
      if (!chat) return current;

      // Защита от дублей: GREEN-API может вернуть одно и то же уведомление.
      if (chat.messages.some((m) => m.id === message.id)) return current;

      // Увеличиваем unread, если сообщение не в активном чате
      const isActive = message.chatId === activeChatIdRef.current;

      return current.map((chat) =>
        chat.id === message.chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              unread: isActive ? 0 : (chat.unread ?? 0) + 1,
            }
          : chat
      );
    });
  }, []);

  const handleChatInfo = useCallback((chatId: string, title?: string, lastMessage?: string, timestamp?: number) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title: title || chat.title,
              lastMessage: lastMessage ?? chat.lastMessage,
              lastMessageAt: timestamp ?? chat.lastMessageAt,
            }
          : chat
      )
    );
  }, []);

  const handleReceiveError = useCallback((message: string) => {
    setConnectionError(message);
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setChats((current) => current.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)));
  }, []);

  useMessages({
    credentials,
    onMessage: handleIncomingMessage,
    onChatInfo: handleChatInfo,
    onError: handleReceiveError,
  });

  // Синхронизируем ref с актуальным activeChatId.
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Автоскрытие ошибки соединения через 7 секунд.
  useEffect(() => {
    if (connectionError) {
      const timer = window.setTimeout(() => setConnectionError(''), 7000);
      return () => window.clearTimeout(timer);
    }
  }, [connectionError]);

  async function handleLogin(nextCredentials: Credentials) {
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await getStateInstance(nextCredentials);
      const state = result.stateInstance;
      if (state !== 'authorized') {
        throw new Error(`Инстанс недоступен. Статус: ${state || 'unknown'}.`);
      }
      // Храним данные в sessionStorage
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextCredentials));
      setCredentials(nextCredentials);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Не удалось проверить credentials.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCreateChat(phone: string) {
    if (!credentials) return;
    const normalized = normalizePhone(phone);

    try {
      // checkAccount возвращает chatId из MAX,
      // который потом используется и для отправки, и для приёма.
      const { chatId } = await checkAccount(credentials, normalized);

      const existing = chats.find((c) => c.id === chatId);

      if (existing) {
        setActiveChatId(chatId);
        setIsNewChatModalOpen(false);
        return;
      }

      let contactInfo: { name?: string; contactName?: string; avatar?: string } = {};

      try {
        contactInfo = await getContactInfo(credentials, chatId);
      } catch {
        // Если контакт скрыл данные, используем телефон как имя.
      }

      const title = contactInfo.name || contactInfo.contactName || formatPhone(normalized);

      setChats((current) => {
        if (current.some((chat) => chat.id === chatId)) return current;
        return [
          ...current,
          {
            id: chatId,
            phone: formatPhone(normalized),
            title,
            avatar: contactInfo.avatar || null,
            messages: [],
            unread: 0,
          },
        ];
      });

      setActiveChatId(chatId);
      setIsNewChatModalOpen(false);
    } catch (error) {
      setCreateChatError(error instanceof Error ? error.message : 'Не удалось добавить контакт');
    }
  }

  async function handleSend(text: string) {
    if (!credentials || !activeChatId) return;

    setSending(true);
    setConnectionError('');

    const temporaryId = crypto.randomUUID();
    const timestamp = Date.now();

    // Оптимистично показываем сообщение до ответа сервера.
    const optimisticMessage: Message = {
      id: temporaryId,
      chatId: activeChatId,
      text,
      direction: 'outgoing',
      timestamp,
      pending: true,
    };

    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, optimisticMessage],
              lastMessage: text,
              lastMessageAt: timestamp,
            }
          : chat
      )
    );

    try {
      const result = await sendMessage(credentials, activeChatId, text);

      // Заменяем временный id на реальный из GREEN-API.
      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: chat.messages.map((message) =>
                  message.id === temporaryId
                    ? { ...message, id: result.idMessage ?? temporaryId, pending: false }
                    : message
                ),
              }
            : chat
        )
      );
    } catch (error) {
      // Откатываем оптимистичное сообщение
      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: chat.messages.filter((message) => message.id !== temporaryId) }
            : chat
        )
      );

      setConnectionError(error instanceof Error ? error.message : 'Не удалось отправить сообщение');
      throw error;
    } finally {
      setSending(false);
    }
  }

  if (!credentials) {
    return <AuthPage loading={loginLoading} error={loginError} onSubmit={handleLogin} setLoginError={setLoginError} />;
  }

  return (
    <>
      <ChatPage
        chats={chats}
        activeChatId={activeChatId}
        sending={sending}
        connectionError={connectionError}
        onSelectChat={handleSelectChat}
        onNewChat={() => setIsNewChatModalOpen(true)}
        onSend={handleSend}
        onBack={() => setActiveChatId(null)}
      />

      {isNewChatModalOpen && (
        <NewChatModal
          createChatError={createChatError}
          setCreateChatError={setCreateChatError}
          onClose={() => {
            setIsNewChatModalOpen(false);
            setCreateChatError('');
          }}
          onCreate={handleCreateChat}
        />
      )}
    </>
  );
}

export default App;
