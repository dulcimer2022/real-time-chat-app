import { useEffect, useRef } from 'react';
import RootsView from './RootsView';
import ThreadView from './ThreadView';
import './MessageArea.css';

export default function MessageArea({
  rootList, messages,
  currentTid, currentChannel,
  username, hoveredId, setHoveredId,
  onSelect, onToggle, onForward, onEdit,
  messageText, setMessageText, onSend, onClearError,
  inputRef 
}) {

  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight; } //scroll to bottom
  }, [rootList, messages]);

  return (
    <div className="content-area">
      <div className="messages-panel">
        <h3>
          {currentTid === null ? `#${currentChannel}` : 'Thread'}
        </h3>
        <div ref={listRef} className="messages-list">
          {currentTid === null ? (
            <RootsView
              roots={rootList}
              username={username}
              onSelect={onSelect}
              onToggle={onToggle}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              onForward={onForward}
              onEdit={onEdit}
            />
          ) : (
            <ThreadView
              messages={messages}
              username={username}
              onBack={onSelect}
              onToggle={onToggle}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              onForward={onForward}
              onEdit={onEdit}
            />
          )}
        </div>
      </div>

      <form className="message-form" onSubmit={onSend}>
        <input
          ref={inputRef} 
          type="text"
          className="message-input"
          value={messageText}
          onChange={e => {
            setMessageText(e.target.value);
            onClearError(); 
          }}
          onFocus={() => {
            const el = listRef.current;
            if (el) el.scrollTop = el.scrollHeight;
           }}
          placeholder={`Message ${
            currentTid === null ? `#${currentChannel}` : 'thread'
          }...`}
        />
        <button type="submit" className="message-button">
          Send
        </button>
      </form>
    </div>
  );
}