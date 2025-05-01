import { EMOJI } from './constants';
import './ReactionBar.css';

export default function ReactionBar({ message, username, onToggle }) {
  // Ensure we have a Map for reactions (fallback for plain objects)
  const reactionsMap =
    message.reactions instanceof Map
      ? message.reactions
      : new Map(Object.entries(message.reactions || {}));

  return (
    <div className="reaction-bar">
      {Array.from(reactionsMap.entries()).map(([key, users]) => {
        const hasReacted = users.includes(username);
        return (
          <button
            key={`${message.id}-${key}`}
            className={hasReacted ? 'mine' : ''}
            onClick={e => {
              e.stopPropagation();
              onToggle(message.id, key, hasReacted);
            }}
          >
            {EMOJI[key]} {users.length}
          </button>
        );
      })}
    </div>
  );
}