import { useState } from 'react';
import './Chat.css'; 
import Loading from './Loading';
import Status from './Status';
import Header from './Header';
import Sidebar from './Sidebar';
import MessageArea from './MessageArea';
import ForwardModal from './ForwardModal';

import { useChatData } from './useChatData';
import {
  createRoot,
  replyThread,
  logout,
  forwardMessage,
  updateMessage,
  createChannel,
} from './services';

export default function Chat({ username, onLogout, setError }) {

  const [messageText, setMessageText] = useState('');
  const [localError, setLocalError] = useState('');
  const [messageToForward, setMessageToForward] = useState(null);

  const {
    roots,
    threadMsgs: messages,
    users,
    channels,
    currentChannel,
    setCurrentChannel,
    currentTid,
    setCurrentTid,
    hoveredId,
    setHoveredId,
    refreshRoots,
    refreshThread,
    toggleReaction
  } = useChatData('public', setLocalError);

  const handleSendMessage = e => {
    e.preventDefault();

    const post = currentTid == null
      ? createRoot(messageText, currentChannel)
      : replyThread(currentTid, messageText);

    post
      .then(() => {
        setMessageText('');
        setLocalError('');
        return currentTid == null
          ? refreshRoots() 
          : refreshThread(); 
      })
      .catch(err => {
        setLocalError(err.error || 'default');
      });
  };

  const handleChannelCreate = (name, setModalError) => {
    return createChannel(name)
      .then(() => {
        setCurrentChannel(name);
        setModalError('channel-creation-success');
      })
      .catch(err => {
        setModalError(err.error || 'default');
        return Promise.reject(err);
      });
  };    

  const handleChannelSelect = (channelId) => {
      setLocalError('');   
      setCurrentTid(null);
      setCurrentChannel(channelId);
  };

  const handleEditMessage = (id, text) => {
    return updateMessage(id, text)
      .then(() => {
        return currentTid == null ? refreshRoots() : refreshThread();
      });
  };

  const handleForwardSubmit = (id, comment) => {
    forwardMessage(id, comment, currentChannel, currentTid)
      .then(() => {
        setMessageToForward(null);

        return currentTid == null ? refreshRoots() : refreshThread();
      })
      .catch(err => {
        setError(err.error || 'default');
      });
  };

  const handleLogoutClick = () => {
    logout()
      .then(() => onLogout())
      .catch(err => setError(err.error || 'networkError'));
  };

  if (!users.length) {
    return <Loading>Loading chat data…</Loading>;
  }

  return (
    <div className="chat">
      <Header username={username} onLogout={handleLogoutClick} />

      {localError && <Status error={localError} />}

      {messageToForward && (
        <ForwardModal
          originalMessage={messageToForward}
          onSubmit={handleForwardSubmit}
          onCancel={() => setMessageToForward(null)}
        />
      )}

      <div className="chat-container">
        <Sidebar
          users={users}
          username={username}
          channels={channels}
          currentChannel={currentChannel}
          onChannelSelect={handleChannelSelect}
          onChannelCreate={handleChannelCreate}
          setError={setLocalError}
        />

        <MessageArea
          rootList={roots}
          messages={messages}
          currentTid={currentTid}
          currentChannel={currentChannel}
          username={username}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onSelect={setCurrentTid}
          onToggle={toggleReaction}
          onForward={setMessageToForward}
          onEdit={handleEditMessage}
          messageText={messageText}
          setMessageText={setMessageText}
          onSend={handleSendMessage}
          onClearError={() => setLocalError('')}
        />
      </div>
    </div>
  );
}
