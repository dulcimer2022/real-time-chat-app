import { useState, useEffect, useRef } from 'react';
import {
  fetchRoots,
  fetchThread,
  fetchUsers,
  fetchChannels,
  addReaction,
  removeReaction
} from './services';

export function useChatData(
  initialChannel = 'public',
  onError = () => {}          
) {
  const [roots,      setRoots]      = useState([]);
  const [threadMsgs, setThreadMsgs] = useState([]);
  const [users,      setUsers]      = useState([]);
  const [channels,   setChannels]   = useState([]);

  const [currentChannel, setCurrentChannel] = useState(initialChannel);
  const [currentTid,     setCurrentTid]     = useState(null);
  const [hoveredId,      setHoveredId]      = useState(null);

  const currentChannelRef = useRef(initialChannel); //useRef to avoid re-render
  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);

  const refreshRoots = () =>
    fetchRoots(currentChannel)
      .then(setRoots)
      .catch(err => onError(err.error || 'networkError'));

  const refreshThread = () => {
    if (currentTid == null) return Promise.resolve();
    return fetchThread(currentTid)
      .then(({ root, replies }) => setThreadMsgs([root, ...replies]))
      .catch(err => onError(err.error || 'networkError'));
  };

  const toggleReaction = (id, key, has) =>
    (has ? removeReaction(id, key) : addReaction(id, key))
      .then(() =>
        currentTid === null ? refreshRoots() : refreshThread()
      )
      .catch(err => onError(err.error || 'networkError'));

  useEffect(() => {
    if (currentTid == null) {
      refreshRoots();
    } else {
      refreshThread();
    }
    fetchUsers()
      .then(setUsers)
      .catch(err => onError(err.error || 'networkError'));
    fetchChannels()
      .then(setChannels)
      .catch(err => onError(err.error || 'networkError'));

    const id = setInterval(() => {
      if (currentTid == null) {
        refreshRoots();
      } else {
        refreshThread();
      }
      fetchUsers()
        .then(setUsers)
        .catch(err => onError(err.error || 'networkError'));
      fetchChannels()
        .then(setChannels)
        .catch(err => onError(err.error || 'networkError'));
    }, 5000);

    return () => clearInterval(id);
  }, [currentChannel, currentTid]);

  return {
    roots,
    threadMsgs,
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
    toggleReaction,
  };
}
