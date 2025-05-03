import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Import your message module
import * as messagesModule from '../../messages.js';

const messages = messagesModule.default;

// Create a test server
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
const ensureLogin = (req, res, next) => {
  req.username = 'testuser';
  next();
};

// Mock the message methods
jest.spyOn(messages, 'addMessage').mockImplementation((username, text, options) => {
  return Promise.resolve({
    _id: 'test-id-123',
    id: 'test-id-123',
    username,
    text,
    channelId: options.channelId || 'public',
    timestamp: new Date().toISOString(),
    reactions: {}
  });
});

// Add routes for testing
app.post('/api/v1/messages', ensureLogin, async (req, res) => {
  const { text, channelId = 'public' } = req.body;
  
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'required-message' });
  }
  
  const msg = await messages.addMessage(req.username, text, { channelId }); 
  res.json(msg);
});

describe('Messages API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/v1/messages', () => {
    test('should create a message when authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/messages')
        .send({ text: 'Test message' });
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('text', 'Test message');
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(messages.addMessage).toHaveBeenCalledWith(
        'testuser', 
        'Test message', 
        { channelId: 'public' }
      );
    });
    
    test('should reject empty messages', async () => {
      const response = await request(app)
        .post('/api/v1/messages')
        .send({ text: '' });
        
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'required-message');
      expect(messages.addMessage).not.toHaveBeenCalled();
    });
    
    test('should allow sending to a specific channel', async () => {
      const response = await request(app)
        .post('/api/v1/messages')
        .send({ 
          text: 'Channel message', 
          channelId: 'test-channel' 
        });
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('channelId', 'test-channel');
      expect(messages.addMessage).toHaveBeenCalledWith(
        'testuser', 
        'Channel message', 
        { channelId: 'test-channel' }
      );
    });
  });
});