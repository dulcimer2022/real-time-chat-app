import { useState, useEffect, useRef } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';
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
  createChannel
} from './services';
import socketService from './socketService';

// loader wrapper for threads
function ThreadRoute({ children, setCurrentTid, refreshThread }) {
  const { threadId } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setCurrentTid(threadId);

    // Join the thread room when loading a thread
    socketService.joinThread(threadId);

    refreshThread(threadId)
      .then(() => setIsLoading(false))
      .catch(err => {
        console.error('Error fetching thread:', err);
        setIsLoading(false);
      });
  }, [threadId, setCurrentTid, refreshThread]); 

  if (isLoading) {
    return <Loading>Loading thread...</Loading>;
  }
  return children;
}

export default function Chat({ username, onLogout, setError }) {
  const navigate = useNavigate();
  const [messageText, setMessageText]   = useState('');
  const [localError, setLocalError]     = useState('');
  const [messageToForward, setMessageToForward] = useState(null);

  const messageInputRef = useRef(null);
  useEffect(() => {
    if (messageInputRef.current) messageInputRef.current.focus();
  }, [messageText]);

  const {
    users,
    channels,
    roots,
    threadMsgs: messages,
    currentChannel,
    currentTid,
    hoveredId,
    setCurrentChannel,
    setCurrentTid,
    setHoveredId,
    refreshRoots,
    refreshThread,
    toggleReaction,
    addChannel,
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
      })
      .catch(err => setLocalError(err.error || 'default'));
  };

  const handleEditMessage = (id, text) => {
    return updateMessage(id, text)
      .then(() => {
        // WebSockets will handle the update
        return Promise.resolve();
      });
  };

  const handleForwardSubmit = (id, comment) => {
    forwardMessage(id, comment, currentChannel, currentTid)
      .then(() => {
        setMessageToForward(null);
      })
      .catch(err => setError(err.error || 'default'));
  };

  const handleChannelCreate = (name, setModalError) => {
    return createChannel(name)
      .then((newChannel) => {
        // WebSockets will notify all clients about the new channel
        // Join the new channel room
        socketService.joinChannel(newChannel.id);
        setCurrentChannel(newChannel.id);
        setModalError('channel-creation-success');
        navigate(`/chat/channel/${newChannel.id}`);
      })
      .catch(err => {
        setModalError(err.error || 'default');
        return Promise.reject(err);
      });
  };

  const handleChannelSelect = channelId => {
    setLocalError('');
    setCurrentTid(null);
    setCurrentChannel(channelId);
    socketService.joinChannel(channelId);
    navigate(`/chat/channel/${channelId}`);
  };

  const handleThreadSelect = threadId => {
    socketService.joinThread(threadId);   //join the thread room
    navigate(`/chat/thread/${threadId}`);
  };

  const handleBackToChannel = () => {
    setCurrentTid(null);
    navigate(`/chat/channel/${currentChannel}`);
  };

  const handleLogoutClick = () => {
    logout()
      .then(() =>{
        socketService.disconnect();
        onLogout();
      })
      .catch(err => setError(err.error || 'networkError'));
  };

  const ChannelView = () => {
    const { channelId } = useParams();
    useEffect(() => {
      if (channelId && channelId !== currentChannel) {
        setCurrentChannel(channelId);
        setCurrentTid(null);
        socketService.joinChannel(channelId);
      }
    }, [channelId]);

    return (
      <MessageArea
        rootList={roots}
        messages={[]}
        currentTid={null}
        currentChannel={currentChannel}
        username={username}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
        onSelect={handleThreadSelect}
        onToggle={toggleReaction}
        onForward={setMessageToForward}
        onEdit={handleEditMessage}
        messageText={messageText}
        setMessageText={setMessageText}
        onSend={handleSendMessage}
        onClearError={() => setLocalError('')}
        inputRef={messageInputRef}
      />
    );
  };

  const ThreadView = () => (
    <MessageArea
      rootList={[]}
      messages={messages}
      currentTid={currentTid}
      currentChannel={currentChannel}
      username={username}
      hoveredId={hoveredId}
      setHoveredId={setHoveredId}
      onSelect={handleBackToChannel}
      onToggle={toggleReaction}
      onForward={setMessageToForward}
      onEdit={handleEditMessage}
      messageText={messageText}
      setMessageText={setMessageText}
      onSend={handleSendMessage}
      onClearError={() => setLocalError('')}
      inputRef={messageInputRef}
    />
  );

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

        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={`/chat/channel/${currentChannel}`} replace />
            }
          />

          <Route
            path="/channel/:channelId"
            element={<ChannelView />}
          />

          <Route
            path="/thread/:threadId"
            element={
              <ThreadRoute
                setCurrentTid={setCurrentTid}
                refreshThread={refreshThread}
              >
                <ThreadView />
              </ThreadRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

