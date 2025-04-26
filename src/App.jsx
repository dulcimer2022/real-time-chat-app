import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    checkForSession();
  }, []);

  const checkForSession = () => {
    fetchSession()
      .then(session => {
        setUsername(session.username);
        setRole(session.role); 
        setLoginStatus(LOGIN_STATUS.IS_LOGGED_IN);
        navigate('/chat');
      })
      .catch(err => {
        if(err?.error === SERVER.AUTH_MISSING) {
          setLoginStatus(LOGIN_STATUS.NOT_LOGGED_IN);
          //navigate('/login');
        } else {
          setError(err?.error || 'ERROR');
          setLoginStatus(LOGIN_STATUS.NOT_LOGGED_IN);
          //navigate('/login');
        }
      });
  };

  const handleLogin = (username) => {
    setUsername(username);
    setLoginStatus(LOGIN_STATUS.IS_LOGGED_IN);
    setError('');
    navigate('/chat');
  };

  const handleLogout = () => {
    setUsername('');
    setLoginStatus(LOGIN_STATUS.NOT_LOGGED_IN);
    setError('');
    navigate('/login');
  };

    // Loading state
    if (loginStatus === LOGIN_STATUS.PENDING) {
      return <Loading>Checking login status...</Loading>
    }

  return (
    <div className="app">
      <h1>Chat Application</h1>
      {error && <Status error={error} />}
      
      <Routes>
        <Route path="/login" element={
          loginStatus === LOGIN_STATUS.IS_LOGGED_IN 
            ? <Navigate to="/chat" />
            : <Login onLogin={handleLogin} setError={setError} />
        } />
        
        <Route path="/chat/*" element={
          loginStatus === LOGIN_STATUS.IS_LOGGED_IN 
            ? <Chat 
                username={username} 
                onLogout={handleLogout} 
                setError={setError}
                role={role}
              />
            : <Navigate to="/login" />
        } />
        
        <Route path="/" element={<Navigate to={loginStatus === LOGIN_STATUS.IS_LOGGED_IN ? "/chat" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;