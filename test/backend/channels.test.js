import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Import your channels module
import * as channelsModule from '../../channels.js';

const channels = channelsModule.default;

// Create a test server
const app = express();
app.use(express.json());

// Mock authentication middleware
const ensureLogin = (req, res, next) => {
  req.username = req.query.asAdmin === 'true' ? 'admin' : 'testuser';
  next();
};

// Mock channel functions
jest.spyOn(channels, 'getChannels').mockImplementation(() => {
  return Promise.resolve([
    { id: 'public', name: 'public' },
    { id: 'introduction', name: 'introduction' }
  ]);
});

jest.spyOn(channels, 'getChannel').mockImplementation((channelId) => {
  if (channelId === 'nonexistent') {
    return Promise.resolve(null);
  }
  return Promise.resolve({ id: channelId, name: channelId });
});

jest.spyOn(channels, 'createChannel').mockImplementation((name, username) => {
  if (username !== 'admin') {
    return Promise.resolve({ ok: false, error: 'auth-insufficient' });
  }
  
  if (!name.match(/^[a-z0-9-_]{2,20}$/)) {
    return Promise.resolve({ ok: false, error: 'invalid-channel-name' });
  }
  
  if (name === 'public') {
    return Promise.resolve({ ok: false, error: 'channel-exists' });
  }
  
  return Promise.resolve({ 
    ok: true, 
    channel: { id: name, name }
  });
});

// Setup routes
app.get('/api/v1/channels', async (req, res) => {
  res.json(await channels.getChannels());
});

app.post('/api/v1/channels', ensureLogin, async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'required-name' });
  }

  if (!name.match(/^[a-z0-9-_]{2,20}$/)) {
    return res.status(400).json({ error: 'invalid-channel-name' });
  }
  
  const result = await channels.createChannel(name, req.username);
  
  if (!result.ok) {
    if (result.error === 'auth-insufficient') {
      return res.status(403).json({ error: 'auth-insufficient' });
    }
    if (result.error === 'channel-exists') {
      return res.status(409).json({ error: 'channel-exists' });
    }
    return res.status(400).json({ error: result.error });
  }

  res.json(result.channel);
});

app.get('/api/v1/channels/:channelId', ensureLogin, async (req, res) => {
  const { channelId } = req.params;
  const channel = await channels.getChannel(channelId);
  
  if (!channel) {
    return res.status(404).json({ error: 'no-such-channel' });
  }
  
  res.json(channel);
});

describe('Channels API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/channels', () => {
    test('should return a list of channels', async () => {
      const response = await request(app).get('/api/v1/channels');
      
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 'public');
      expect(channels.getChannels).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/channels', () => {
    test('should create a channel when admin user', async () => {
      const response = await request(app)
        .post('/api/v1/channels')
        .query({ asAdmin: 'true' })
        .send({ name: 'test-channel' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'test-channel');
      expect(response.body).toHaveProperty('name', 'test-channel');
      expect(channels.createChannel).toHaveBeenCalledWith('test-channel', 'admin');
    });

    test('should reject channel creation for non-admin user', async () => {
      const response = await request(app)
        .post('/api/v1/channels')
        .send({ name: 'test-channel' });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'auth-insufficient');
      expect(channels.createChannel).toHaveBeenCalledWith('test-channel', 'testuser');
    });

    test('should reject invalid channel name', async () => {
      const response = await request(app)
        .post('/api/v1/channels')
        .query({ asAdmin: 'true' })
        .send({ name: 'Invalid Channel!' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid-channel-name');
    });

    test('should reject duplicate channel name', async () => {
      const response = await request(app)
        .post('/api/v1/channels')
        .query({ asAdmin: 'true' })
        .send({ name: 'public' });
      
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'channel-exists');
      expect(channels.createChannel).toHaveBeenCalledWith('public', 'admin');
    });
  });

  describe('GET /api/v1/channels/:channelId', () => {
    test('should return a channel by ID', async () => {
      const response = await request(app).get('/api/v1/channels/public');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'public');
      expect(response.body).toHaveProperty('name', 'public');
      expect(channels.getChannel).toHaveBeenCalledWith('public');
    });

    test('should return 404 for nonexistent channel', async () => {
      const response = await request(app).get('/api/v1/channels/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'no-such-channel');
      expect(channels.getChannel).toHaveBeenCalledWith('nonexistent');
    });
  });
});