import { useState } from 'react';
import './Modal.css';

function ForwardModal({ originalMessage, onSubmit, onCancel }) {
  const [comment, setComment] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(originalMessage.id, comment);
  };
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick = {handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Forward Message</h2>
        </div>
        
        <div className="original-message">
          <div className="message-username">{originalMessage.username}</div>
          <div className="message-text">{originalMessage.text}</div>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="forward-comment">Add a comment (optional)</label>
            <textarea
              id="forward-comment"
              className="form-input comment-area"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="modal-buttons">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Forward
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForwardModal;