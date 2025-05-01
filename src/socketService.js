import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : window.location.origin;

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
};

// Initialize socket connection
export function initSocket(sid) {
  if (socket) {
    socket.disconnect();
  }

  // Create new socket connection with session ID for authentication
  socket = io(SOCKET_SERVER_URL, {
    auth: { sid },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  setupListeners();

  return socket;
}

// Setup listeners for socket events
function setupListeners() {
  if (!socket) return;

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  // Handle custom events
  Object.keys(listeners).forEach(event => {
    socket.on(event, (data) => {
      listeners[event].forEach(callback => callback(data));
    });
  });
}

export function joinChannel(channelId) {
  if (!socket || !socket.connected) return;
  socket.emit('join-channel', channelId);
}

export function joinThread(threadId) {
  if (!socket || !socket.connected) return;
  socket.emit('join-thread', threadId);
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
  disconnect
};