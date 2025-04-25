import { randomUUID } from 'crypto';

const sessions = {};

function addSession(username) {
  const sid = randomUUID();
  sessions[sid] = {
    username,
  };
  return sid;
}

function getSessionUser(sid) {
  return sessions[sid]?.username;
}

function deleteSession(sid) {
  delete sessions[sid];
}

function getAllUsers() {
  const usernames = new Set();
  
  Object.values(sessions).forEach(session => {
    if(session && session.username) {
      usernames.add(session.username);
    }
  });
  
  return Array.from(usernames);
}

export default {
  addSession,
  deleteSession,
  getSessionUser,
  getAllUsers,
};