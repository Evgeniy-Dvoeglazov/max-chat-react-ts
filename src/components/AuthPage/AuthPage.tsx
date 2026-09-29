import { useEffect, useState } from 'react';
import './AuthPage.css';
import type { SubmitEvent } from 'react';
import type { Credentials } from '../../types';
import { ErrorText } from '../shared/Avatar/ErrorText/ErrorText';

interface AuthPageProps {
  initial?: Credentials;
  loading: boolean;
  error: string;
  onSubmit: (credentials: Credentials) => Promise<void>;
  setLoginError: (error: string) => void;
}

export function AuthPage({ initial, loading, error, onSubmit, setLoginError }: AuthPageProps) {
  const [instanceId, setInstanceId] = useState(initial?.idInstance ?? '');
  const [apiTokenInstance, setApiTokenInstance] = useState(initial?.apiTokenInstance ?? '');
  const [showToken, setShowToken] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    await onSubmit({
      idInstance: instanceId.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    });
  }

  useEffect(() => {
    setLoginError('');
  }, [instanceId, apiTokenInstance, setLoginError]);

  return (
    <main className='authPage'>
      <form className='authPage__form' onSubmit={handleSubmit}>
        <div className='authPage__logo'>M</div>
        <h1>Авторизация</h1>
        <p className='authPage__subtitle'>Введите данные GREEN-API</p>
        <label>
          ID инстанса
          <input
            name='instanceId'
            type='text'
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
            autoComplete='off'
          />
        </label>
        <label>
          API Token
          <div className='authPage__password'>
            <input
              name='token'
              type={showToken ? 'text' : 'password'}
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              autoComplete='off'
            />
            <button type='button' onClick={() => setShowToken((v) => !v)}>
              {showToken ? 'Скрыть' : 'Показать'}
            </button>
          </div>
        </label>
        {error && <ErrorText>Неверные данные или ошибка подключения</ErrorText>}
        <button
          className='authPage__submitButton'
          type='submit'
          disabled={!instanceId.trim() || !apiTokenInstance.trim() || loading}
        >
          {loading ? 'Подключение…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
