import { useState, useEffect, useCallback } from 'react';
import {
  fetchUsers,
  fetchChannels,
  fetchRoots,
  fetchThread,
  addReaction,
  removeReaction
} from './services';

export function useChatData(defaultChannel, onError) {
  const [users, setUsers]             = useState([]);        
  const [channels, setChannels]       = useState([]);        
  const [roots, setRoots]             = useState([]);
  const [threadMsgs, setThreadMsgs]   = useState([]);
  const [currentChannel, setCurrentChannel] = useState(defaultChannel);
  const [currentTid, setCurrentTid]   = useState(null);
  const [hoveredId, setHoveredId]     = useState(null);
 
  const addChannel = useCallback(newChannel => {
    setChannels(ch => [...ch, newChannel]);
  }, []);

  const refreshUsers = useCallback(() => {
    return fetchUsers()
      .then(setUsers)
      .catch(err => {
        onError(err.error || 'default');
        throw err;
      });
  }, [onError]);

  const refreshChannels = useCallback(() => {
    return fetchChannels()
      .then(setChannels)
      .catch(err => {
        onError(err.error || 'default');
        throw err;
      });
  }, [onError]);

  // memoized loader for channel roots
  const refreshRoots = useCallback(() => {
    return fetchRoots(currentChannel)
      .then(setRoots)
      .catch(err => {
        onError(err.error || 'default');
        throw err;
      });
  }, [currentChannel, onError]);

  const refreshThread = useCallback((tid) => {
    return fetchThread(tid)
      .then(({ root, replies }) => {
        setThreadMsgs([root, ...replies]);
      })
      .catch(err => {
        onError(err.error || 'default');
        throw err;
      });
  }, [onError]);

  const toggleReaction = useCallback((messageId, key) => {
    return addReaction(messageId, key)
      .catch(() => removeReaction(messageId, key))
      .then(() =>
        currentTid == null
          ? refreshRoots()
          : refreshThread(currentTid)
      )
      .catch(err => onError(err.error || 'default'));
  }, [currentTid, refreshRoots, refreshThread, onError]);

  useEffect(() => {
    refreshUsers();
    refreshChannels();
  }, [refreshUsers, refreshChannels]);

  useEffect(() => {
    refreshRoots();
  }, [currentChannel, refreshRoots]);

  useEffect(() => {
    if (currentTid != null) {
      refreshThread(currentTid);
    } else {
      setThreadMsgs([]);
    }
  }, [currentTid, refreshThread]);

  return {
    users,
    channels,
    roots,
    threadMsgs,
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
  };
}
