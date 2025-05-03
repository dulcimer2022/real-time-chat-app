import { jest } from '@jest/globals';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { createServer } from 'http';

// Mock sessions module
const mockSessions = {
  getSessionUser: jest.fn(),
  getAllUsers: jest.fn()
};

// Import your actual session module and mock it
jest.mock('../../sessions.js', () => ({
  __esModule: true,
  default: mockSessions
}));

describe('Socket.IO Server', () => {
  jest.setTimeout(5000); // Add this line to increase the timeout for all tests in this file
  
  let io, serverSocket, clientSocket, httpServer;
  const connectedSockets = [];
  
  beforeAll(() => {
    // Set up mock implementations
    mockSessions.getSessionUser.mockImplementation((sid) => {
      if (sid === 'valid-sid') {
        return Promise.resolve('testuser');
      }
      return Promise.resolve(null);
    });
    
    mockSessions.getAllUsers.mockImplementation(() => {
      return Promise.resolve(['testuser', 'user2']);
    });
  });

  beforeEach((done) => {
    // Create HTTP server
    httpServer = createServer();
    
    // Initialize Socket.IO server with fast ping timeout
    io = new Server(httpServer, {
      pingTimeout: 100,
      connectTimeout: 100,
      closeTimeout: 100
    });
    
    // Setup authentication middleware
    io.use(async (socket, next) => {
      const sid = socket.handshake.auth.sid;
      if (!sid) {
        return next(new Error('No session ID provided'));
      }
      
      const username = await mockSessions.getSessionUser(sid);
      if (!username) {
        return next(new Error('Invalid session ID'));
      }
      
      socket.username = username;
      next();
    });
    
    // Setup connection handler
    io.on('connection', (socket) => {
      serverSocket = socket;
      connectedSockets.push(socket);
      
      // Join default room
      socket.join('global');
      
      // Join user's room
      socket.join(`user:${socket.username}`);
      
      // Emit users list
      mockSessions.getAllUsers().then(users => {
        io.emit('users-updated', users);
      });
      
      socket.on('join-channel', (channelId) => {
        socket.join(`channel:${channelId}`);
        io.to(`channel:${channelId}`).emit('user-joined-channel', {
          username: socket.username,
          channelId
        });
      });
      
      socket.on('join-thread', (threadId) => {
        socket.join(`thread:${threadId}`);
        io.to(`thread:${threadId}`).emit('user-joined-thread', {
          username: socket.username,
          threadId
        });
      });
    });
    
    // Start the server
    httpServer.listen(() => {
      done();
    });
  });
  
  afterEach((done) => {
    // Disconnect all client sockets
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
      clientSocket = null;
    }
    
    // Disconnect all server sockets
    connectedSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect(true);
      }
    });
    connectedSockets.length = 0;
    
    // Close the IO instance first
    if (io) {
      io.close();
    }
    
    // Use a timeout to ensure all connections are properly closed
    setTimeout(() => {
      // Then close the HTTP server and wait for it to complete
      httpServer.close(() => {
        // Clear all timeouts and intervals
        jest.clearAllTimers();
        done();
      });
    }, 200);
  });
  
  test('should authenticate with valid session ID', (done) => {
    const port = httpServer.address().port;
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { sid: 'valid-sid' },
      forceNew: true,
      reconnection: false
    });
    
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
    
    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });
  
  test('should fail authentication with invalid session ID', (done) => {
    const port = httpServer.address().port;
    const invalidClient = Client(`http://localhost:${port}`, {
      auth: { sid: 'invalid-sid' },
      forceNew: true,
      reconnection: false
    });
    
    invalidClient.on('connect_error', (err) => {
      expect(err.message).toContain('Invalid session ID');
      invalidClient.close();
      done();
    });
  });
  
  test('should emit users-updated on connection', (done) => {
    const port = httpServer.address().port;
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { sid: 'valid-sid' },
      forceNew: true,
      reconnection: false
    });
    
    clientSocket.on('users-updated', (users) => {
      expect(users).toBeInstanceOf(Array);
      expect(users).toContain('testuser');
      expect(users).toContain('user2');
      done();
    });
  });
  
  test('should join a channel and emit event', (done) => {
    const port = httpServer.address().port;
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { sid: 'valid-sid' },
      forceNew: true,
      reconnection: false
    });
    
    clientSocket.on('connect', () => {
      clientSocket.emit('join-channel', 'test-channel');
    });
    
    clientSocket.on('user-joined-channel', (data) => {
      expect(data.username).toBe('testuser');
      expect(data.channelId).toBe('test-channel');
      done();
    });
  });
  
  test('should join a thread and emit event', (done) => {
    const port = httpServer.address().port;
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { sid: 'valid-sid' },
      forceNew: true,
      reconnection: false
    });
    
    clientSocket.on('connect', () => {
      clientSocket.emit('join-thread', 'test-thread-id');
    });
    
    clientSocket.on('user-joined-thread', (data) => {
      expect(data.username).toBe('testuser');
      expect(data.threadId).toBe('test-thread-id');
      done();
    });
  });
});