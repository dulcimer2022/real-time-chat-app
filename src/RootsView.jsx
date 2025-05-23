import { useState } from 'react';
import ReactionBar from './ReactionBar';
import EmojiPicker from './EmojiPicker'; 
import EditMessage from './EditMessage';

export default function RootsView({ roots, username, onSelect, onToggle, hoveredId, setHoveredId, onForward, onEdit }) {
  const [editingId, setEditingId] = useState(null);

  if (!roots.length) {
    return <p className="no-messages">No messages yet. Be the first to send one!</p>;
  }

  return roots.map(root => (
    <div key={root._id}
         className={`message ${root.username===username ? 'message-own' : ''}`}
         onClick={() => editingId === null}
         onMouseEnter={() => setHoveredId(root._id)}
         onMouseLeave={() => setHoveredId(null)}>

      <div className="message-username">
        {root.username}
        <span className="message-timestamp">
          {new Date(root.timestamp).toLocaleTimeString()}
        </span>
      </div>
      {root.isForwarded && (
        <div className="forwarded-content">
          <div className="forwarded-tag">Forwarded from {root.originalMessage.username}</div>
          <div className="original-content">
            {root.originalMessage.text}
          </div>
        </div>
      )}

      {editingId === root._id ? (
        <EditMessage 
          message={root}
          onSave={(id, text) => {
            return onEdit(id, text)
              .then(() => setEditingId(null));
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <div className="message-text">
          {root.text}
          {root.edited && <span className="edited-indicator">(edited)</span>}
        </div>
      )}

      { hoveredId === root._id &&
        <EmojiPicker
          message={root}
          username={username}
          onToggle={onToggle}
        />
      }

      <button 
        className="badge"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(root._id);
        }}
      >
        💬 {root.replyCount}
      </button>

      {root.username === username && !editingId && (
        <button 
          className="message-action"
          onClick={(e) => {
            e.stopPropagation();
            setEditingId(root._id);
          }}
        >
          ✏️
        </button>
      )}

      <button 
        className="message-action forward-btn"
        onClick={(e) => {
          e.stopPropagation();
          onForward(root);
        }}
      >
        ↪️
      </button>

      <ReactionBar
        message={root}
        username={username}
        onToggle={onToggle}
      />
    </div>
  ));
}