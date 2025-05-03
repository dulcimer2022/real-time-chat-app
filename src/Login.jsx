import { useState } from 'react';
import './Login.css';
import { login, register } from './services';
import Loading from './Loading';
import Status from './Status';

function Login({ onLogin, setError }) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [mode, setMode] = useState('register');   
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    setIsLoading(true);
    setLocalError('');
    setSuccess(''); 
    
    if (!username.trim()) {
      setLocalError('required-username');
      setIsLoading(false);
      return;
    }
    const promise =
      mode === 'login' ? login(username) : register(username);

      promise
      .then(() => {
        if (mode === 'register') {
          setSuccess('registration-success');
          setMode('login');
        } else {
          onLogin(username);      
        }
      })
      .catch((err) => {
        setLocalError(err?.error || 'ERROR');
        setError('');         
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="login">
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      
      {success && <Status error={success} />}
      {localError && <Status error={localError} />}

      {isLoading ? (
        <Loading>
          {mode === 'login' ? 'Logging in…' : 'Registering…'}
        </Loading>
      ) : (
        <>
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="username">
              Username:
              <input
                id="username"
                className="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            <button type="submit" className="login-button">
              {mode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

          <p className="switch">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setMode('register')}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setMode('login')}
                >
                  Login
                </button>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

export default Login;
