import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Chat from './Chat';
import Loading from './Loading';
import Status from './Status';
import { fetchSession } from './services';
import { LOGIN_STATUS, CLIENT, SERVER } from './constants';

function App() {
  const [loginStatus, setLoginStatus] = useState(LOGIN_STATUS.PENDING);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('user');

  useEffect(() => {
    checkForSession();
  }, []);

  const checkForSession = () => {
    fetchSession()
      .then(session => {
        setUsername(session.username);
        setRole(session.role); 
        setLoginStatus(LOGIN_STATUS.IS_LOGGED_IN);
      })
      .catch(err => {
        if(err?.error === SERVER.AUTH_MISSING) {
          setLoginStatus(LOGIN_STATUS.NOT_LOGGED_IN);
        } else {
          setError(err?.error || 'ERROR');
          setLoginStatus(LOGIN_STATUS.NOT_LOGGED_IN);
        }
      });
  };

  const handleLogin = (username) => {
    setUsername(username);
    setLoginStatus(LOGIN_STATUS.IS_LOGGED_IN);
    setError('');
  };

  const handleLogout = () => {
    setUsername('');
    setLoginStatus(LOGIN_STATUS.NOT_LOGGED_IN);
    setError('');
  };

  return (
    <div className="app">
      <h1>Chat Application</h1>
      {error && <Status error={error} />}
      
      {loginStatus === LOGIN_STATUS.PENDING && (
        <Loading>Checking login status...</Loading>
      )}
      
      {loginStatus === LOGIN_STATUS.NOT_LOGGED_IN && (
        <Login onLogin={handleLogin} setError={setError} />
      )}
      
      {loginStatus === LOGIN_STATUS.IS_LOGGED_IN && (
        <Chat 
          username={username} 
          onLogout={handleLogout} 
          setError={setError}
        />
      )}
    </div>
  );
}

export default App;