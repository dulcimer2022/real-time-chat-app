import { useState } from 'react';
import './ChannelList.css';
import ChannelModal from './ChannelModal';
import { SERVER } from './constants';

function ChannelList({ channels, currentChannel, username, onChannelSelect, onChannelCreate, setError }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const handleCreateClick = () => {
    if (username !== 'admin') {
      setError(SERVER.AUTH_INSUFFICIENT);
      return;
    }
    setError('');
    setShowCreateModal(true);
  };
  
  const handleCreateSubmit = (name, setModalError) => {
    onChannelCreate(name, setModalError)
      .then(() => {
        setError('channel-creation-success');
        setShowCreateModal(false);
      })
      .catch(err => {
        setModalError(err?.error || 'ERROR');
      });
  };
  
  return (
    <div className="channels-panel">
      <div className="channels-header">
        <h3 className="channels-title">Channels</h3>
        <button 
          className="create-channel-btn"
          onClick={handleCreateClick}
          title="Create a new channel (admin only)"
        >
          +Add
        </button>
      </div>
      
      <ul className="channels-list">
        {channels.map(channel => (
          <li 
            key={channel.id}
            className={`channel-item ${channel.id === currentChannel ? 'active-channel' : ''}`}
            onClick={() => onChannelSelect(channel.id)}
          >
            # {channel.name}
          </li>
        ))}
      </ul>
      
      {showCreateModal && (
        <ChannelModal 
          onSubmit={handleCreateSubmit}
          onCancel={() => {
            setShowCreateModal(false);
            setError('');
          }}
        />
      )}
    </div>
  );
}

export default ChannelList;