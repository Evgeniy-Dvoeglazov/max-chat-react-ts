import { ChatList } from '../ChatList/ChatList';
import { ChatMessages } from '../ChatMessages/ChatMessages';
import type { Chat } from '../../types';
import './ChatPage.css';

interface ChatPageProps {
  chats: Chat[];
  activeChatId: string | null;
  sending: boolean;
  connectionError: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onSend: (text: string) => Promise<void>;
  onBack: () => void;
}

export const ChatPage = ({
  chats,
  activeChatId,
  sending,
  connectionError,
  onNewChat,
  onSelectChat,
  onSend,
  onBack,
}: ChatPageProps) => {
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

  return (
    <main className='chatPage'>
      <ChatList chats={chats} activeChatId={activeChatId} onSelect={onSelectChat} onNewChat={onNewChat} />
      {activeChat ? (
        <ChatMessages
          messages={activeChat.messages}
          sending={sending}
          connectionError={connectionError}
          onSend={onSend}
          activeChat={activeChat}
          onBack={onBack}
        />
      ) : (
        <section className='chatPage__placeholder'>
          <p>Выберите чат или создайте новый</p>
        </section>
      )}
    </main>
  );
};
