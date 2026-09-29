import { MessageInput } from '../MessageInput/MessageInput';
import { MessageList } from '../MessageList/MessageList';
import type { Chat, Message } from '../../types';
import './ChatMessages.css';
import { Avatar } from '../shared/Avatar/Avatar';
import { ErrorText } from '../shared/Avatar/ErrorText/ErrorText';

interface ChatMessagesProps {
  activeChat: Chat;
  sending: boolean;
  messages: Message[];
  connectionError: string;
  onSend: (text: string) => Promise<void>;
  onBack: () => void;
}
export function ChatMessages({ activeChat, sending, messages, connectionError, onSend, onBack }: ChatMessagesProps) {
  return (
    <section className='chatMessages'>
      <header className='chatMessages__header'>
        <button className='chatMessages__back' onClick={onBack} aria-label='Назад'>
          ←
        </button>
        <Avatar src={activeChat.avatar} name={activeChat.title} />
        <div>
          <strong>{activeChat.title}</strong>
          <span>{activeChat.phone}</span>
        </div>
      </header>

      {connectionError && <ErrorText>{`Ошибка: ${connectionError}`}</ErrorText>}

      <MessageList messages={messages} />
      <MessageInput disabled={sending} onSend={onSend} />
    </section>
  );
}
