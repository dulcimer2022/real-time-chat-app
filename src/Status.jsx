import { MESSAGES } from './constants';
import './Status.css';

function Status({ error }) {
    const message = MESSAGES[error] || MESSAGES.default;
    const isSuccess = error === 'registration-success' || error === 'channel-creation-success';
    return (
      <div className={`status ${isSuccess ? 'success' : ''}`}>
        {error && message}
      </div>
    );
  }
  

export default Status;