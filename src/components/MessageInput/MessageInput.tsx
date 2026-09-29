import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import './MessageInput.css';

interface MessageInputProps {
  disabled: boolean;
  onSend: (text: string) => Promise<void>;
}

const MAX_LENGTH = 4000;

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');

  async function submit() {
    const value = text.trim();

    if (!value || disabled) {
      return;
    }

    try {
      await onSend(value);
      // Очищаем поле только при успехе — при ошибке текст остаётся для повторной попытки.
      setText('');
    } catch {
      // Ошибка отображается родительским компонентом. Текст остаётся в поле
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter - отправляем, Shift+Enter — перенос строки.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <section className='messageInput'>
      <textarea
        className='messageInput__textarea'
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Отправка…' : 'Cообщениe'}
        rows={1}
        maxLength={MAX_LENGTH}
      ></textarea>
      {(disabled || text.trim()) && (
        <button type='button' onClick={() => submit()} aria-label='Отправить'>
          ↑
        </button>
      )}
    </section>
  );
}
