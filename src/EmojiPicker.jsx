import { EMOJI, DEFAULT_EMOJI_KEYS } from './constants';
import './EmojiPicker.css';   

export default function EmojiPicker({ message, username, onToggle }) {
  const reacted = key =>
    (message.reactions?.[key] || []).includes(username);

  return (
    <div className="emoji-picker">
      {DEFAULT_EMOJI_KEYS.map(key => (
        <button
          key={key}
          onClick={(e) => {
            e.stopPropagation(); 
            onToggle(message.id, key, reacted(key));
          }}
        >
          {EMOJI[key]}
        </button>
      ))}
    </div>
  );
}
