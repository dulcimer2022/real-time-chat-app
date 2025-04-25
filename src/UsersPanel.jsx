import './UsersPanel.css';

export default function UsersPanel({ users, username }) {
  return (
    <div className="users-panel">
      <h3>Online Users ({users.length})</h3>
      <ul className="users-list">
        {users.map(u => (
          <li key={u} className={u === username ? 'current-user' : ''}>
            {u}
          </li>
        ))}
      </ul>
    </div>
  );
}
