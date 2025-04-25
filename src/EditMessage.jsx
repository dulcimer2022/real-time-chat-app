import { useState } from 'react';
import './EditMessage.css';
import { SERVER, MESSAGES } from './constants';

function EditMessage({ message, onSave, onCancel }) {
  const [editText, setEditText] = useState(message.text);
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    if (!editText.trim()) {
      setError(MESSAGES[SERVER.REQUIRED_MESSAGE]);
    }
    
    onSave(message.id, editText)
      .then(() => {
        setError('');
        onCancel();
      })
      .catch(err => {
        setError(MESSAGES[err.error] || MESSAGES.default)
      });
  };
  
  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <textarea
        className="edit-textarea"
        value={editText}
        onChange={(e) => {
          setEditText(e.target.value);
          if (error) setError('');
        }}
        autoFocus
      />

      {error && <div className="edit-error">{error}</div>}

      <div className="edit-buttons">
        <button 
          type="button" 
          className="cancel-edit-btn"
          onClick={(e) => {
            e.stopPropagation(); 
            onCancel();
          }}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="save-edit-btn"
        >
          Save
        </button>
      </div>
    </form>
  );
}

export default EditMessage;