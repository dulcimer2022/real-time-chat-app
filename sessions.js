import { randomUUID } from 'crypto';
import Session from './models/Session.js';


async function addSession(username) {
  const sid = randomUUID();
  await Session.create({ sid, username });
  return sid;
}

async function getSessionUser(sid) {
  const session = await Session.findOne({ sid });
  return session ? session.username : null
}

async function deleteSession(sid) {
  await Session.deleteOne({ sid });
}

async function getAllUsers() {
  const sessions = await Session.find({});
  const usernames = new Set();
  
  sessions.forEach(session => {
    usernames.add(session.username);
  });
  
  return Array.from(usernames);
}

export default {
  addSession,
  deleteSession,
  getSessionUser,
  getAllUsers,
};