//const messages = [];

// Simulated database of messages
const messagesDb = [];
let nextId = 1;

function addReaction(id, username, key){            
  const numericId = Number(id);
  const message = messagesDb.find(msg => msg.id === numericId);

  if(!message){ return null; }
  // Initialize the reaction array if needed
  if (!message.reactions[key]) {
    message.reactions[key] = [];
  }

  // Add username to the reaction if not already there
  if (!message.reactions[key].includes(username)) {
    message.reactions[key].push(username);
  }
  
  return message;
}

function removeReaction(id, username, key){         
  const numericId = Number(id);
  const message = messagesDb.find(msg => msg.id === numericId);

  if (!message) return null;

  // If the reaction exists, remove the username
  if (message.reactions[key]) {
    message.reactions[key] = message.reactions[key].filter(u => u !== username);
    
    // Remove the reaction key entirely if no users are left
    if (message.reactions[key].length === 0) {
      delete message.reactions[key];
    }
  }
  
  return message;
}

function addMessage(username, text, options = {}) {
  const { threadId = null, parentId = null, channelId = 'public', originalMessage = null } = options;
  
  const isForwarded = !!originalMessage;

  const message = {
    id: nextId++,
    username,
    text,
    timestamp: Date.now(),
    reactions: {},
    parentId,
    threadId: threadId !== null ? Number(threadId) : null,
    channelId,
    isForwarded,
    originalMessage,
    edited: false,
  };
  
  messagesDb.push(message);
  return message;
}

// New method to get a specific message
function getMessage(id) {
  const messageId = Number(id);
  return messagesDb.find(msg => msg.id === messageId);
}

function listRoots(channelId = 'public') {
  return messagesDb
    .filter(msg => !msg.threadId && msg.channelId === channelId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

function listThread(tid) {
    // Convert to number to ensure type safety
    const numericThreadId = Number(tid);
    //const threadId = typeof tid === 'number' ? tid : +tid;
    
  // Find the root message first (message with id === threadId)
  const root = messagesDb.find(msg => msg.id === numericThreadId);
  if (!root) return [];
  
  // Then find all messages in the thread (with threadId === threadId)
  const replies = messagesDb
    .filter(msg => msg.threadId === numericThreadId && msg.id !== numericThreadId)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  return [root, ...replies];
}

//forward feature
function forwardMessage(username, originalMessageId, comment = '', options = {}) {
  const { channelId = 'public', threadId = null } = options;
  //const originalMessage = messages.find(m => m.id === +originalMessageId);
  const numericId = Number(originalMessageId);
  const originalMessage = messagesDb.find(msg => msg.id === numericId);

  if (!originalMessage) {
    return null;
  }
  
  //const channelId = options.channelId || originalMessage.channelId || 'public';
  
  // Create a new message with a reference to the original
  const forwardedMessage = addMessage(
    username,
    comment,
    {
      threadId,
      channelId,
      originalMessage: {
        id: originalMessage.id,
        username: originalMessage.username,
        text: originalMessage.text
      }
    }
  );
  
  return forwardedMessage;
}

//editing feature
function updateMessage(id, username, text) {
  const numericId = Number(id);
  const message = messagesDb.find(msg => msg.id === numericId);

  if(!message){
    return null;
  }

  if (message.username !== username){
    return { error: 'not-authorized'};
  }

  message.text = text;
  message.edited = true;

  return message;
}

export default {
  addMessage,
  getMessage,
  addReaction,
  removeReaction,
  listRoots,
  listThread,
  forwardMessage,
  updateMessage,
};