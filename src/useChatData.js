import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchUsers,
  fetchChannels,
  fetchRoots,
  fetchThread,
  addReaction,
  removeReaction
} from './services';
import socketService from './socketService';

export function useChatData(defaultChannel, onError) {
  const [users, setUsers]             = useState([]);        
  const [channels, setChannels]       = useState([]);        
  const [roots, setRoots]             = useState([]);
  const [threadMsgs, setThreadMsgs]   = useState([]);
  const [currentChannel, setCurrentChannel] = useState(defaultChannel);
  const [currentTid, setCurrentTid]   = useState(null);
  const [hoveredId, setHoveredId]     = useState(null);

  // Refs to keep track of current values in callbacks
  const currentChannelRef = useRef(defaultChannel);
  const currentTidRef = useRef(null);
  const rootsRef = useRef([]);
  const threadMsgsRef = useRef([]);

  // Update refs when state changes
  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);
  
  useEffect(() => {
    currentTidRef.current = currentTid;
  }, [currentTid]);
  
  useEffect(() => {
    rootsRef.current = roots;
  }, [roots]);
  
  useEffect(() => {
    threadMsgsRef.current = threadMsgs;
  }, [threadMsgs]);

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
      .then(rootsArr => {
        //reverse to oldest-first
        setRoots([...rootsArr].reverse());
      })
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

  const toggleReaction = useCallback((messageId, key, hasReacted) => {
    // if user already reacted, call remove; otherwise add
    const action = hasReacted ? removeReaction : addReaction;
    return action(messageId, key)
      .then(() =>
        currentTidRef.current == null
          ? refreshRoots()
          : refreshThread(currentTidRef.current)
      )
      .catch(err => onError(err.error || 'default'));
  }, [refreshRoots, refreshThread, onError]);

  //initial data loading
  useEffect(() => {     
    refreshUsers();
    refreshChannels();
  }, [refreshUsers, refreshChannels]);

  useEffect(() => {
    refreshRoots();
  }, [currentChannel, refreshRoots]);

  // Handle WebSocket events
  useEffect(() => {
    // Join the current channel room
    socketService.joinChannel(currentChannel);
    
    // Setup socket event listeners
    const unsubscribeUsersUpdated = socketService.on('users-updated', newUsers => {
      setUsers(newUsers);
    });
    
    const unsubscribeChannelCreated = socketService.on('channel-created', newChannel => {
      setChannels(prevChannels => [...prevChannels, newChannel]);
    });
    
    const unsubscribeMessageCreated = socketService.on('message-created', newMessage => {
      // 1) If in a thread and this message belongs there, append it
      if (
        currentTidRef.current != null &&
        newMessage.threadId === currentTidRef.current
      ) {
        setThreadMsgs(prev => [...prev, newMessage]);
      }
      // 2) if a new root in the current channel, append it there
      else if (
        newMessage.channelId === currentChannelRef.current &&
        !newMessage.threadId
      ) {
        setRoots(prevRoots => [...prevRoots, newMessage]);
      }
    });
    
    const unsubscribeMessageUpdated = socketService.on('message-updated', updatedMessage => {
      // Update in roots if in current channel
      if (updatedMessage.channelId === currentChannelRef.current && !updatedMessage.threadId) {
        setRoots(prevRoots => {
          return prevRoots.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          );
        });
      }
      
      // Update in thread messages
      if (updatedMessage.threadId === currentTidRef.current || updatedMessage.id === currentTidRef.current) {
        setThreadMsgs(prevMsgs => {
          return prevMsgs.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          );
        });
      }
    });
    
    const unsubscribeReactionUpdated = socketService.on('reaction-updated', updatedMessage => {
      // Update in roots if in current channel
      if (updatedMessage.channelId === currentChannelRef.current && !updatedMessage.threadId) {
        setRoots(prevRoots => {
          return prevRoots.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          );
        });
      }
      
      // Update in thread messages
      if (updatedMessage.threadId === currentTidRef.current || updatedMessage.id === currentTidRef.current) {
        setThreadMsgs(prevMsgs => {
          return prevMsgs.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          );
        });
      }
    });
    
    const unsubscribeReplyCreated = socketService.on('reply-created', newReply => {
      if (newReply.threadId === currentTidRef.current) {
        setThreadMsgs(prevMsgs => [...prevMsgs, newReply]);
      }
    });
    
    const unsubscribeThreadUpdated = socketService.on('thread-updated', updatedRoot => {
      if (updatedRoot.channelId === currentChannelRef.current) {
        setRoots(prevRoots => {
          return prevRoots.map(msg => 
            msg.id === updatedRoot.id ? updatedRoot : msg
          );
        });
      }
    });
    
    return () => {
      unsubscribeUsersUpdated();
      unsubscribeChannelCreated();
      unsubscribeMessageCreated();
      unsubscribeMessageUpdated();
      unsubscribeReactionUpdated();
      unsubscribeReplyCreated();
      unsubscribeThreadUpdated();
    };
  }, [currentChannel]);

  // Join thread room when current thread changes
  useEffect(() => {
    if (currentTid) {
      socketService.joinThread(currentTid);
    }
  }, [currentTid]);


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
