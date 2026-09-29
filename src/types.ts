export type MessageDirection = 'incoming' | 'outgoing';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  direction: MessageDirection;
  timestamp: number;
  pending?: boolean;
}

export interface Chat {
  id: string;
  phone: string;
  title: string;
  avatar: string | null;
  lastMessage?: string;
  lastMessageAt?: number;
  messages: Message[];
  unread: number;
}

export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

export interface InstanceStateResponse {
  stateInstance?: string;
}

export interface SendMessageResponse {
  idMessage?: string;
  [key: string]: unknown;
}

export interface GreenApiNotification {
  receiptId: number;
  body: GreenApiWebhook;
}

export interface GreenApiWebhook {
  typeWebhook?: string;
  timestamp?: number;
  idMessage?: string;
  instanceData?: {
    idInstance?: number;
    wid?: string;
    typeInstance?: string;
  };
  senderData?: {
    chatId?: string;
    chatName?: string;
    chatType?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage?: string;
    textMessageData?: {
      textMessage?: string;
    };
  };
}
