import { useState } from 'react';
import './NewChatModal.css';
import { ErrorText } from '../shared/Avatar/ErrorText/ErrorText';
interface NewChatModalProps {
  createChatError: string;
  setCreateChatError: (error: string) => void;
  onClose: () => void;
  onCreate: (phone: string) => void;
}
export function NewChatModal({ createChatError, setCreateChatError, onClose, onCreate }: NewChatModalProps) {
  const [phone, setPhone] = useState('');
  return (
    <div
      className='newChatModal'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className='newChatModal__container'>
        <div className='newChatModal__header'>
          <div>
            <h2>Введите номер телефона</h2>
          </div>
        </div>
        <input
          autoFocus
          value={phone}
          onChange={(e) => {
            setCreateChatError('');
            setPhone(e.target.value);
          }}
          placeholder='+71234567890'
        />
        {createChatError && <ErrorText>{createChatError}</ErrorText>}
        <button className='primary' disabled={!phone.trim()} onClick={() => onCreate(phone.trim())}>
          Найти
        </button>
      </div>
    </div>
  );
}
