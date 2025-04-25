import { EMOJI } from './constants';
import './ReactionBar.css';

export default function ReactionBar({ message, username, onToggle }) {
  const reacted = key =>
    (message.reactions?.[key] || []).includes(username);

  return (
    <div className="reaction-bar">
      {Object.keys(message.reactions || {}).map(key => (
        <button
          key={key}
          className={reacted(key) ? 'mine' : ''}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(message.id, key, reacted(key));
          }}
        >
          {EMOJI[key]} {message.reactions[key].length}
        </button>
      ))}
    </div>
  );
}
