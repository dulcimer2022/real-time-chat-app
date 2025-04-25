import express from 'express';
import cookieParser from 'cookie-parser';

import sessions from './sessions.js';
import users from './users.js';
import messages from './messages.js';
import channels from './channels.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());

function ensureLogin(req, res, next) {
  const sid = req.cookies.sid;
  const user = sid && sessions.getSessionUser(sid);
  if (!sid || !user) {
    res.clearCookie('sid', { path: '/' });
    return res.status(401).json({ error: 'auth-missing' });
  }
  req.username = user;         
  next();
}

app.post('/api/v1/register', (req,res)=>{
    const { username } = req.body;

    if(!username) {
      res.status(400).json({ error: 'required-username' });
      return;
    }

    if (!users.isValid(username)) {
        res.status(400).json({ error: 'invalid-username' });
        return;
    }

    if (username === 'dog') {
        res.status(403).json({ error: 'auth-insufficient' });
        return;
    }
  
    const result = users.register(username);
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

app.post('/api/v1/session', (req, res) => {
  const { username } = req.body;
  
    if(!username) {
    res.status(400).json({ error: 'required-username' });
    return;
    }
  
    if(!users.isValid(username)){
       res.status(400).json({ error:'invalid-username' });
       return;
    }
    
    if(!users.isRegistered(username)){
       res.status(401).json({ error:'user-not-registered' });
       return;
     }
  
    if(username === 'dog') {
        res.status(403).json({ error: 'auth-insufficient' });
        return;
    }
  
  const sid = sessions.addSession(username);
  res.cookie('sid', sid);
  res.json({ username });
});

app.use('/api/v1', ensureLogin);  // middleware to ensure login for all routes below, avoid duplicate

app.get('/api/v1/session', (req, res) => {  
  const role = (req.username === 'admin') ? 'admin' : 'user';
  res.json({ username: req.username, role });
});

app.delete('/api/v1/session', (req, res) => {
  sessions.deleteSession(req.cookies.sid);
  res.clearCookie('sid');
  res.json({ wasLoggedIn: true });
});

app.get('/api/v1/users', (req, res) => {
  const usernames = sessions.getAllUsers();
  res.json(usernames);
});

//emoji reactions feature
app.post('/api/v1/messages/:id/reactions', (req,res)=>{
  const { key } = req.body;
  const updated = messages.addReaction(req.params.id, req.username, key);
  if(!updated){
    res.status(404).json({ error:'noSuchId' });
    return;
  }
  res.json(updated);
});

app.delete('/api/v1/messages/:id/reactions/:key', (req,res)=>{
  const updated = messages.removeReaction(req.params.id, req.username, req.params.key);
  if(!updated){
    res.status(404).json({ error:'noSuchId' });
    return;
  }
  res.json(updated);
});

//thread endpoints
app.get('/api/v1/messages', (req, res) => {
  const channelId = req.query.channelId || 'public';
  
  const roots = messages.listRoots(channelId).map(root => {
    const replyCount = messages.listThread(root.id).length - 1;
    return { ...root, replyCount };
  });
  
  res.json(roots);
}); 

app.get('/api/v1/threads/:tid', (req, res) => {
    const tid = req.params.tid;
    if (isNaN(tid)) {
      return res.status(400).json({ error: 'invalid-tid' });
    }
    
    const data = messages.listThread(tid);
    if (!data.length) {
      return res.status(404).json({ error: 'noSuchThread' });
    }
    const [root, ...replies] = data;
    res.json({ root, replies });
});

app.post('/api/v1/messages', (req, res) => {
  const { text, channelId = 'public' } = req.body;
  
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'required-message' });
  }
  
  const msg = messages.addMessage(req.username, text, { channelId }); 
  res.json(msg);
}); 

app.post('/api/v1/threads/:tid', (req, res) => {
    const { text, parentId = null } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'required-message' });
    }

    const tid = req.params.tid;
    if (isNaN(tid)) {
      return res.status(400).json({ error: 'invalid-tid' });
    }

    const thread = messages.listThread(tid);
    if (!thread.length) {
      return res.status(404).json({ error: 'noSuchThread' });
    }

    const channelId = thread[0].channelId || 'public';

    const msg = messages.addMessage(req.username, text, { 
      threadId: tid, 
      parentId: parentId || tid,
      channelId
    });
    res.json(msg);
}); 

//channel endpoints
app.get('/api/v1/channels', (req, res) => {
  res.json(channels.getChannels());
});

app.post('/api/v1/channels', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'required-name' });
  }

  if (!name.match(/^[a-z0-9-_]{2,20}$/)) {
    return res.status(400).json({ error: 'invalid-channel-name' });
  }
  
  const result = channels.createChannel(name, req.username);
  
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

app.get('/api/v1/channels/:channelId/messages', (req, res) => {
  const { channelId } = req.params;
  const channel = channels.getChannel(channelId);
  
  if (!channel) {
    return res.status(404).json({ error: 'no-such-channel' });
  }
  
  const roots = messages.listRoots(channelId).map(root => {
    const replyCount = messages.listThread(root.id).length - 1;
    return { ...root, replyCount };
  });
  
  res.json(roots);
});

//forwarding message endpoints
app.post('/api/v1/messages/:id/forward', (req, res) => {
  const { comment = '', channelId = 'public', threadId = null } = req.body;
  const messageId = req.params.id;
  
  const forwardedMessage = messages.forwardMessage(req.username, messageId, comment, {
    channelId, threadId  });
  
  if (!forwardedMessage) {
    return res.status(404).json({ error: 'no-such-message' });
  }
  
  res.json(forwardedMessage);
});

//editing feature
app.patch('/api/v1/messages/:id', (req, res) => {
  const { text }  = req.body;
  if(!text || !text.trim()) {
    return res.status(400).json({ error: 'required-message' });
  }

  const result = messages.updateMessage(req.params.id, req.username, text);

  if(!result) {
    return res.status(404).json({error:'no-such-message'});
  }

  if(result.error) {
    return res.status(403).json({error: result.error});
  }

  res.json(result);
})

app.use(express.static('./dist'));
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));