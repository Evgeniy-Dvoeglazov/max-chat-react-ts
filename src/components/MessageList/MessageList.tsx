import { useEffect, useRef } from 'react';
import type { Message } from '../../types';
import './MessageList.css';
import { formatTime } from '../../utils/time';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  // Запоминаем предыдущее состояние, чтобы понять, что изменилось: сменился чат или добавилось сообщение.
  const prevCountRef = useRef(messages.length);
  const prevChatIdRef = useRef<string | null>(messages[0]?.chatId ?? null);

  useEffect(() => {
    const currentChatId = messages[0]?.chatId ?? null;
    const chatChanged = currentChatId !== prevChatIdRef.current;
    const messageAdded = messages.length > prevCountRef.current;

    // Скроллим вниз если сменился чат или добавилось новое сообщение
    if (chatChanged || messageAdded) {
      endRef.current?.scrollIntoView({ behavior: chatChanged ? 'auto' : 'smooth' });
    }

    prevCountRef.current = messages.length;
    prevChatIdRef.current = currentChatId;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className='messageList messageList_empty'>
        <p className='messageList__placeholder'>Напишите первое сообщение</p>
      </div>
    );
  }

  return (
    <div className='messageList'>
      <div className='messageList__inner'>
        {messages.map((message) => (
          <div key={message.id} className={`messageList__message messageList__message_${message.direction}`}>
            <div className='messageList__messageContent'>
              {message.text}
              <span>
                {formatTime(message.timestamp)}
                {message.direction === 'outgoing' && (
                  <i className={`messageList__status ${message.pending ? 'messageList__status_pending' : ''}`}>
                    {message.pending ? '⏱' : '✓'}
                  </i>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div ref={endRef} />
    </div>
  );
}
