import './Header.css';

export default function Header({ username, onLogout }) {
  return (
    <div className="chat-header">
      <h2>Welcome, {username}!</h2>
      <button onClick={onLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}