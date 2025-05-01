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
        // normalize each msg.reactions into a Map
        const normalized = rootsArr.map(m => ({
          ...m,
          reactions: new Map(Object.entries(m.reactions || {}))
        }));
        setRoots(normalized.reverse());
      })
      .catch(err => {
        onError(err.error || 'default');
        throw err;
      });
  }, [currentChannel, onError]);

  const refreshThread = useCallback((tid) => {
    return fetchThread(tid)
      .then(({ root, replies }) => {
        const normRoot = {
            ...root,
            reactions: new Map(Object.entries(root.reactions || {}))
          };
          const normReplies = replies.map(r => ({
            ...r,
            reactions: new Map(Object.entries(r.reactions || {}))
          }));
          setThreadMsgs([normRoot, ...normReplies]);
      })
      .catch(err => {
        onError(err.error || 'default');
        throw err;
      });
  }, [onError]);

  const toggleReaction = useCallback((messageId, key, hasReacted) => {
    // if user already reacted, call remove; otherwise add
    const id = messageId?.toString();
    const action = hasReacted ? removeReaction : addReaction;
    return action(id, key)
      .catch(err => onError(err.error || 'default'));
  }, [onError]); 

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
    // normalize incoming reactions into a Map 
        const normalized = {
          ...newMessage,
          reactions: new Map(Object.entries(newMessage.reactions || {}))
        };
        if (
          currentTidRef.current != null &&
          normalized.threadId === currentTidRef.current
        ) {
          setThreadMsgs(prev => [...prev, normalized]);
        } else if (
          normalized.channelId === currentChannelRef.current &&
          !normalized.threadId
        ) {
          setRoots(prev => [...prev, normalized]);
        }
      });
    
    const unsubscribeMessageUpdated = socketService.on('message-updated', updatedMessage => {
      const uid = updatedMessage.id || updatedMessage._id?.toString();
      updatedMessage.id = uid;

      if (updatedMessage._id && !updatedMessage.id) {
        updatedMessage.id = updatedMessage._id;
      }
      // Update in roots if in current channel
      if (updatedMessage.channelId === currentChannelRef.current && !updatedMessage.threadId) {
        setRoots(prevRoots => {
          return prevRoots.map(msg => 
            msg.id === uid ? updatedMessage : msg
          );
        });
      }
      
      // Update in thread messages
      if (updatedMessage.threadId === currentTidRef.current || updatedMessage.id === currentTidRef.current) {
        setThreadMsgs(prevMsgs => {
          return prevMsgs.map(msg => 
            msg.id === uid ? updatedMessage : msg
          );
        });
      }
    });
    
    const unsubscribeReactionUpdated = socketService.on( 'reaction-updated', updatedMessage => {
        // normalize to string ID
        const uid = updatedMessage.id || updatedMessage._id?.toString();
        updatedMessage.id = uid;
        updatedMessage.reactions = new Map(
          Object.entries(updatedMessage.reactions || {}));

        // update roots if in this channel
        if (
          updatedMessage.channelId === currentChannelRef.current &&
          !updatedMessage.threadId
        ) {
          setRoots(prev =>
            prev.map(m => (m.id === uid ? updatedMessage : m)));
        }

        // update thread if it belongs here or thread root
        if (
          updatedMessage.threadId === currentTidRef.current ||
          uid === currentTidRef.current
        ) {
          setThreadMsgs(prev =>
            prev.map(m => (m.id === uid ? updatedMessage : m))
          );
        }}
    );
    
  const unsubscribeReplyCreated = socketService.on('reply-created', newReply => {
      // ─ normalize incoming reactions into a Map ─
      const normalizedReply = {
        ...newReply,
        reactions: new Map(Object.entries(newReply.reactions || {}))
      };
      if (normalizedReply.threadId === currentTidRef.current) {
        setThreadMsgs(prev => [...prev, normalizedReply]);
      }
  });
    
    const unsubscribeThreadUpdated = socketService.on('thread-updated', updatedRoot => {
      const rid = updatedRoot.id || updatedRoot._id?.toString();
      updatedRoot.id = rid;

      if (updatedRoot.channelId === currentChannelRef.current) {
        setRoots(prevRoots => {
          return prevRoots.map(msg => 
            msg.id === rid ? updatedRoot : msg
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
