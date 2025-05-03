import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// Import your server modules
import * as usersModule from '../../users.js';
import * as sessionsModule from '../../sessions.js';

const users = usersModule.default;
const sessions = sessionsModule.default;

// Create a test server
const app = express();
app.use(cookieParser());
app.use(express.json());

// Mock the user functions
jest.spyOn(users, 'isValid').mockImplementation((username) => {
  return Promise.resolve(!!username && username.match(/^[A-Za-z0-9_]+$/));
});

jest.spyOn(users, 'register').mockImplementation((username) => {
  if (username === 'existinguser') {
    return Promise.resolve({ ok: false, error: 'user-exists' });
  }
  return Promise.resolve({ ok: true });
});

jest.spyOn(users, 'isRegistered').mockImplementation((username) => {
  return Promise.resolve(username === 'existinguser');
});

jest.spyOn(sessions, 'addSession').mockImplementation(() => {
  return Promise.resolve('test-session-id');
});

// Add routes
app.post('/api/v1/register', async (req, res) => {
  const { username } = req.body;

  if(!username) {
    res.status(400).json({ error: 'required-username' });
    return;
  }

  if (!await users.isValid(username)) {
    res.status(400).json({ error: 'invalid-username' });
    return;
  }

  const result = await users.register(username);
  if(!result.ok){
    const map = {
      'invalid-username' : { status:400, code:'invalid-username' },
      'user-exists'      : { status:409, code:'user-exists' },
    }[result.error];
    res.status(map.status).json({ error: map.code });
    return;
  }
  res.json({ username });
});

app.post('/api/v1/session', async (req, res) => {
  const { username } = req.body;
  
  if(!username) {
    res.status(400).json({ error: 'required-username' });
    return;
  }
  
  if(!await users.isValid(username)){
    res.status(400).json({ error:'invalid-username' });
    return;
  }
    
  if(!await users.isRegistered(username)){
    res.status(401).json({ error:'user-not-registered' });
    return;
  }
  
  const sid = await sessions.addSession(username);
  res.cookie('sid', sid);
  res.json({ username });
});

describe('Authentication API', () => {
  // Clear all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/register', () => {
    test('should register a valid username', async () => {
      const response = await request(app)
        .post('/api/v1/register')
        .send({ username: 'testuser' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(users.register).toHaveBeenCalledWith('testuser');
    });

    test('should reject an invalid username', async () => {
      const response = await request(app)
        .post('/api/v1/register')
        .send({ username: 'invalid@user' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'invalid-username');
    });

    test('should reject a missing username', async () => {
      const response = await request(app)
        .post('/api/v1/register')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'required-username');
    });
  });

  describe('POST /api/v1/session', () => {
    test('should login a registered user', async () => {
      const response = await request(app)
        .post('/api/v1/session')
        .send({ username: 'existinguser' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'existinguser');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should reject login for unregistered user', async () => {
      const response = await request(app)
        .post('/api/v1/session')
        .send({ username: 'nonexistentuser' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'user-not-registered');
    });
  });
});