import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = window.location.origin;

let socket = null;

// Event listeners
const listeners = {
  'users-updated': [],
  'message-created': [],
  'reply-created': [],
  'thread-updated': [],
  'reaction-updated': [],
  'message-updated': [],
  'channel-created': [],
  'joined-channel': [], 
};

// Initialize socket connection
export function initSocket(sid) {
  if (socket) {
    socket.disconnect();
  }

  console.log(`Initializing socket connection to ${SOCKET_SERVER_URL} with SID: ${sid}`);

  // Create new socket connection with session ID for authentication
  socket = io(SOCKET_SERVER_URL, {
    auth: { sid },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
  });

  setupListeners();

  return socket;
}

function setupListeners() {
  if (!socket) return;

  socket.on('connect', () => {});

  socket.on('connect_error', (error) => {});

  socket.on('disconnect', (reason) => {});

  // Handle custom events
  Object.keys(listeners).forEach(event => {
    socket.on(event, (data) => {
      listeners[event].forEach(callback => callback(data));
    });
  });
}

export function joinChannel(channelId) {
  if (!socket) {
    return;
  }
  
  if (!socket.connected) {
    waitForConnection(() => {
      socket.emit('join-channel', channelId);
    });
    return;
  }
  socket.emit('join-channel', channelId);
}

export function joinThread(threadId) {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('join-thread', threadId);
}

export function waitForConnection(callback, interval = 200, maxAttempts = 10) {
  let attempts = 0;
  
  const checkConnection = () => {
    if (socket && socket.connected) {
      callback();
      return;
    }
    
    attempts++;
    if (attempts >= maxAttempts) {
      return;
    }
    
    setTimeout(checkConnection, interval);
  };
  
  checkConnection();
}

// Register a callback for a specific event
export function on(event, callback) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);

  // Return a function to unregister the callback
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
}

// Disconnect socket
export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  initSocket,
  joinChannel,
  joinThread,
  on,
  disconnect,
  waitForConnection
};