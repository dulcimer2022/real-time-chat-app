import { useState } from 'react';
import './Modal.css';
import { MESSAGES } from './constants';

function ChannelModal({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    onSubmit(name.trim().toLowerCase(), setLocalError);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };
  
  return (
    <div className="modal-overlay"  onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Create a New Channel</h2>
        </div>
        
        {localError && (
          <div className="modal-error">
            {MESSAGES[localError] || MESSAGES.default}
          </div>
        )}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="channel-name">Channel Name (required)</label>
            <input
              id="channel-name"
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
            />
            <p className="form-help">
              2-20 characters, lowercase letters, numbers, hyphens, and underscores only
            </p>
          </div>
          
          <div className="modal-buttons">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChannelModal;