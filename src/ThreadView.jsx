import { useState } from 'react';
import ReactionBar from './ReactionBar';
import EmojiPicker from './EmojiPicker';
import EditMessage from './EditMessage';

export default function ThreadView({ messages, username, onBack, onToggle, hoveredId, setHoveredId, onForward, onEdit  }) {
  const [editingId, setEditingId] = useState(null);

  if (!messages.length) { return null; }

  return (
    <>
      <button className="back" onClick={(e) => {
        e.stopPropagation(); 
        onBack();
      }}>← Back</button>

      {messages.map(msg => (
        <div key={msg.id}
             className={`message ${msg.username===username ? 'message-own' : ''}`}
             onMouseEnter={() => setHoveredId(msg.id)}
             onMouseLeave={() => setHoveredId(null)}>
          <div className="message-username">{msg.username}</div>

          {msg.isForwarded && (
            <div className="forwarded-content">
              <div className="forwarded-tag">Forwarded message from {msg.originalMessage.username}</div>
              <div className="original-content">
                {msg.originalMessage.text}
              </div>
            </div>
          )}

          {editingId === msg.id ? (
            <EditMessage 
              message={msg}
              onSave={(id, text) => {
                return onEdit(id, text)
                  .then(() => setEditingId(null));
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="message-text">
              {msg.text}
              {msg.edited && <span className="edited-indicator">(edited)</span>}
            </div>
          )}

          {msg.username === username && !editingId && (
            <button 
              className="message-action"
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(msg.id);
              }}
            >
              ✏️
            </button>
          )}

          <button 
            className="message-action forward-btn"
            onClick={(e) => {
              e.stopPropagation();
              onForward(msg);
            }}
          >
            ↪️ 
          </button>

          { hoveredId === msg.id &&
            <EmojiPicker
              message={msg}
              username={username}
              onToggle={onToggle}
            />
          }

          <ReactionBar
            message={msg}
            username={username}
            onToggle={onToggle}
          />
        </div>
      ))}
    </>
  );
}