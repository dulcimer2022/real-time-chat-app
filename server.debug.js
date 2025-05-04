process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  console.error(err.stack);
  process.exit(1);
});

import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer} from 'http';
import { Server } from 'socket.io';
import connectDB from './db.js';

import sessions from './sessions.js';
import users from './users.js';
import messages from './messages.js';
import channels from './channels.js';

connectDB().then(() => {
  initializeDatabase();
});

async function initializeDatabase() {
  try {
    // Check if admin user exists
    const adminExists = await users.isRegistered('admin');
    if (!adminExists) {
      await users.register('admin');
      console.log('Admin user created');
    }
    
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PATCH"]
  }
});

app.use(cookieParser());
app.use(express.json());

async function ensureLogin(req, res, next) {
  const sid = req.cookies.sid;
  const user = sid && await sessions.getSessionUser(sid);
  if (!sid || !user) {
    res.clearCookie('sid', { path: '/' });
    return res.status(401).json({ error: 'auth-missing' });
  }
  req.username = user;         
  next();
}

// Socket.io middleware to authenticate socket connections
io.use(async (socket, next) => {
  const sid = socket.handshake.auth.sid;
  if (!sid) {
    return next(new Error('No session ID provided'));
  }
  
  const username = await sessions.getSessionUser(sid);
  if (!username) {
    return next(new Error('Invalid session ID'));
  }
  
  console.log(`Socket authenticated for user: ${username}`);
  socket.username = username;
  next();
});

// Socket.io connection event
io.on('connection', async (socket) => {
  console.log(`User ${socket.username} connected`);
  
  // Join default room (can be used for global notifications)
  socket.join('global');
  
  // Join user's own room for private messages
  socket.join(`user:${socket.username}`);
  
  // Join channel rooms
  const channelList = await channels.getChannels();
  channelList.forEach(channel => {
    socket.join(`channel:${channel.id}`);
  });  
  
  // Notify everyone about new connection
  const list = await sessions.getAllUsers();
  io.emit('users-updated', list);
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
    sessions.getAllUsers().then(updated => {
        io.emit('users-updated', updated);
    });
  });
  
  socket.on('join-channel', (channelId) => {
    socket.join(`channel:${channelId}`);
  });
  
  socket.on('join-thread', (threadId) => {
    socket.join(`thread:${threadId}`);
  });
});

app.post('/api/v1/register', async (req,res)=>{
    const { username } = req.body;

    if(!username) {
      res.status(400).json({ error: 'required-username' });
      return;
    }

    if (!await users.isValid(username)) {
        res.status(400).json({ error: 'invalid-username' });
        return;
    }

    if (username === 'dog') {
        res.status(403).json({ error: 'auth-insufficient' });
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
  
    if(username === 'dog') {
        res.status(403).json({ error: 'auth-insufficient' });
        return;
    }
  
  const sid = await sessions.addSession(username);
  res.cookie('sid', sid);
  res.json({ username });
});

app.use('/api/v1', ensureLogin);  // middleware to ensure login for all routes below, avoid duplicate

app.get('/api/v1/session', async (req, res) => {  
  const role = (req.username === 'admin') ? 'admin' : 'user';
  res.json({ username: req.username, role });
});

app.delete('/api/v1/session', async (req, res) => {
  await sessions.deleteSession(req.cookies.sid);
  res.clearCookie('sid');
  res.json({ wasLoggedIn: true });
});

app.get('/api/v1/users', async (req, res) => {
  const usernames = await sessions.getAllUsers();
  res.json(usernames);
});

//emoji reactions feature
app.post('/api/v1/messages/:id/reactions', async (req,res)=>{
  const { key } = req.body;
  const updated = await messages.addReaction(req.params.id, req.username, key);
  if(!updated){
    res.status(404).json({ error:'noSuchId' });
    return;
  }

  // Emit reaction update to relevant channels and threads
  if (updated.threadId) {
    // Apply documentToObject before emitting
    const formattedMessage = typeof updated.toObject === 'function' ? updated.toObject() : updated;
    if (formattedMessage._id && !formattedMessage.id) {
      formattedMessage.id = formattedMessage._id.toString();
    }
    io.to(`thread:${updated.threadId}`).emit('reaction-updated', formattedMessage);
  } else {
    // Apply documentToObject before emitting
    const formattedMessage = typeof updated.toObject === 'function' ? updated.toObject() : updated;
    if (formattedMessage._id && !formattedMessage.id) {
      formattedMessage.id = formattedMessage._id.toString();
    }
    io.to(`channel:${updated.channelId || 'public'}`).emit('reaction-updated', formattedMessage);
  }

  res.json(updated);
});

app.delete('/api/v1/messages/:id/reactions/:key', async (req,res)=>{
  const updated = await messages.removeReaction(req.params.id, req.username, req.params.key);
  if(!updated){
    res.status(404).json({ error:'noSuchId' });
    return;
  }

  // Emit reaction update to relevant channels and threads
  if (updated.threadId) {
    // Apply documentToObject before emitting
    const formattedMessage = typeof updated.toObject === 'function' ? updated.toObject() : updated;
    if (formattedMessage._id && !formattedMessage.id) {
      formattedMessage.id = formattedMessage._id.toString();
    }
    io.to(`thread:${updated.threadId}`).emit('reaction-updated', formattedMessage);
  } else {
    // Apply documentToObject before emitting
    const formattedMessage = typeof updated.toObject === 'function' ? updated.toObject() : updated;
    if (formattedMessage._id && !formattedMessage.id) {
      formattedMessage.id = formattedMessage._id.toString();
    }
    io.to(`channel:${updated.channelId || 'public'}`).emit('reaction-updated', formattedMessage);
  }
  res.json(updated);
});

//thread endpoints
app.get('/api/v1/messages', async (req, res) => {
  const channelId = req.query.channelId || 'public';
  
  let roots = await messages.listRoots(channelId);

  // Use Promise.all for parallel processing
  roots = await Promise.all(roots.map(async root => {
    const thread = await messages.listThread(root._id);
    const rootObj = typeof root.toObject === 'function' ? root.toObject() : root;
    rootObj.id = rootObj._id.toString(); // Add id property as string
    return { ...rootObj, replyCount: thread.length - 1 };
  }));  
  
  res.json(roots);
}); 

app.get('/api/v1/threads/:tid', async (req, res) => {
  const tid = req.params.tid;
  if (!tid.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'invalid-tid' });
  }
  
  const data = await messages.listThread(tid);
  if (!data.length) {
    return res.status(404).json({ error: 'noSuchThread' });
  }
  const [root, ...replies] = data;
  
  // Check if toObject exists before calling it
  const rootObj = typeof root.toObject === 'function' ? root.toObject() : root;
  rootObj.id = rootObj._id.toString();
  
  const repliesObj = replies.map(reply => {
    const replyObj = typeof reply.toObject === 'function' ? reply.toObject() : reply;
    replyObj.id = replyObj._id.toString();
    return replyObj;
  });
  
  res.json({ root: rootObj, replies: repliesObj });
});

app.post('/api/v1/messages', async (req, res) => {
  const { text, channelId = 'public' } = req.body;
  
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'required-message' });
  }
  
  const msg = await messages.addMessage(req.username, text, { channelId }); 

  // Emit new message to the channel
  io.to(`channel:${channelId}`).emit('message-created', msg);

  res.json(msg);
}); 

app.post('/api/v1/threads/:tid', async (req, res) => {
    const { text, parentId = null } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'required-message' });
    }

    const tid = req.params.tid;
    if (!tid.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'invalid-tid' });
    }

    const thread = await messages.listThread(tid);
    if (!thread.length) {
      return res.status(404).json({ error: 'noSuchThread' });
    }

    const channelId = thread[0].channelId || 'public';

    const msg = await messages.addMessage(req.username, text, { 
      threadId: tid, 
      parentId: parentId || tid,
      channelId
    });

    // Emit new reply to the thread and update the reply count in the channel
    io.to(`thread:${tid}`).emit('reply-created', msg);
    
    // Also update the channel with updated replyCount
    const rootMsg = await messages.getMessage(tid);
    if (rootMsg) {
      const threadList = await messages.listThread(tid);
      const updatedRoot = {
        ...rootMsg,
        replyCount: threadList.length - 1
      };
      io.to(`channel:${channelId}`).emit('thread-updated', updatedRoot);
    }

    res.json(msg);
}); 

//channel endpoints
app.get('/api/v1/channels', async (req, res) => {
  res.json(await channels.getChannels());
});

app.post('/api/v1/channels', async (req, res) => {
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

    // Emit channel created event
    io.emit('channel-created', result.channel);
  
    // Add all connected sockets to the new channel room
    Object.values(io.sockets.sockets).forEach(socket => {
      socket.join(`channel:${result.channel.id}`);
    });

  res.json(result.channel);
});

app.get('/api/v1/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const channel = await channels.getChannel(channelId);
  
  if (!channel) {
    return res.status(404).json({ error: 'no-such-channel' });
  }
  
  let roots = await messages.listRoots(channelId);
  roots = await Promise.all(roots.map(async root => {
    const thread = await messages.listThread(root._id);
    return { ...root.toObject(), replyCount: thread.length - 1 };
  }));
  
  res.json(roots);
});

//forwarding message endpoints
app.post('/api/v1/messages/:id/forward', async (req, res) => {
  const { comment = '', channelId = 'public', threadId = null } = req.body;
  const messageId = req.params.id;
  
  const forwardedMessage = await messages.forwardMessage(req.username, messageId, comment, {
    channelId, threadId  });
  
  if (!forwardedMessage) {
    return res.status(404).json({ error: 'no-such-message' });
  }

  // Emit forwarded message event
  if (threadId) {
    io.to(`thread:${threadId}`).emit('message-created', forwardedMessage);
  } else {
    io.to(`channel:${channelId}`).emit('message-created', forwardedMessage);
  }
  res.json(forwardedMessage);
});

//editing feature
app.patch('/api/v1/messages/:id', async (req, res) => {
  const { text }  = req.body;
  if(!text || !text.trim()) {
    return res.status(400).json({ error: 'required-message' });
  }

  const result = await messages.updateMessage(req.params.id, req.username, text);

  if(!result) {
    return res.status(404).json({error:'no-such-message'});
  }

  if(result.error) {
    return res.status(403).json({error: result.error});
  }

  // Emit message-updated event
  if (result.threadId) {
    io.to(`thread:${result.threadId}`).emit('message-updated', result);
  } else {
    io.to(`channel:${result.channelId || 'public'}`).emit('message-updated', result);
  }

  res.json(result);
})

app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Internal Server Error');
});

app.use(express.static('./dist'));

// For any other request, send the index.html file
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile('index.html', { root: './dist' });
});

httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running at http://localhost:${PORT}`));