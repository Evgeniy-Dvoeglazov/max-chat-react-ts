import type { Chat } from '../../types';
import { formatPhone } from '../../utils/phone';
import { formatTime } from '../../utils/time';
import { Avatar } from '../shared/Avatar/Avatar';
import './ChatList.css';

interface ChatListProps {
  chats: Chat[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}
export function ChatList({ chats, activeId, onSelect, onNewChat }: ChatListProps) {
  return (
    // На мобильном при открытом чате список скрывается через класс chatList_hidden.
    <aside className={`chatList ${activeId && 'chatList_hidden'}`}>
      <div className='chatList__header'>
        <h2>Чаты</h2>
        <button className='chatList__addButton' onClick={onNewChat} aria-label='Новый чат'>
          +
        </button>
      </div>
      <div className='chatList__items'>
        {chats.map((chat) => (
          <button
            key={chat.id}
            className={`chatList__item ${chat.id === activeId ? 'chatList__item_active' : ''}`}
            onClick={() => onSelect(chat.id)}
          >
            <Avatar src={chat.avatar} name={chat.title} />
            <div className='chatList__chatPreview'>
              <strong>{chat.title}</strong>
              <span className='chatList__lastMessage'>{chat.lastMessage || formatPhone(chat.phone)}</span>
            </div>
            <span className='chatList__meta'>
              {chat.lastMessageAt && <span>{formatTime(chat.lastMessageAt)}</span>}
              {chat.unread ? <b>{chat.unread > 99 ? '99+' : chat.unread}</b> : null}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
