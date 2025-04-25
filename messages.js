
const messages = [];

function addReaction(id, username, key){            
  const msg = messages.find(m => m.id === +id);
  if(!msg){ return null; }
  msg.reactions ||= {};
  msg.reactions[key] ||= [];
  if(!msg.reactions[key].includes(username)){
    msg.reactions[key].push(username);
  }
  return msg;
}

function removeReaction(id, username, key){         
  const msg = messages.find(m => m.id === +id);
  if(!msg || !msg.reactions?.[key]){ return null; }
  msg.reactions[key] = msg.reactions[key].filter(u=>u!==username);
  if(!msg.reactions[key].length){ delete msg.reactions[key]; }
  return msg;
}

function addMessage(username, text, options = {}) {
    const id = messages.length + 1;
    const { threadId = null, parentId = null, channelId = 'public' } = options;
  
    const message = {
      id,
      username,
      text,
      reactions: {},
      parentId,
      threadId: threadId !== null ? +threadId : null, // Ensure threadId is a number
      channelId,
    };
  
    if (message.threadId === null) {
      message.threadId = id;
    }
    
    messages.push(message);
    return message;
  }


function getMessages() {
  return [...messages]; 
}

function listRoots(channelId = 'public') {
  return messages.filter(m => 
    m.parentId === null && 
    m.threadId === m.id &&
    m.channelId === channelId
  );
}

function listThread(tid) {
    const threadId = typeof tid === 'number' ? tid : +tid;
    
    if (isNaN(threadId)) {
      return [];
    }
    
    return messages
      .filter(m => m.threadId === +tid) 
      .sort((a, b) => a.id - b.id);
}

function getMessagesByChannel(channelId) {
  return messages.filter(m => m.channelId === channelId);
}

//forward feature
function forwardMessage(username, originalMessageId, comment = '', options = {}) {
  const originalMessage = messages.find(m => m.id === +originalMessageId);
  if (!originalMessage) {
    return null;
  }
  
  const channelId = options.channelId || originalMessage.channelId || 'public';
  
  const id = messages.length + 1;
  const newMessage = {
    id,
    username,
    text: comment || '',
    reactions: {},
    channelId,
    isForwarded: true,
    originalMessage: {
      id: originalMessage.id,
      username: originalMessage.username,
      text: originalMessage.text
    }
  };
  
  if (options.threadId) {
    newMessage.threadId = options.threadId;
    newMessage.parentId = options.threadId;
  } else {
    newMessage.threadId = id;
    newMessage.parentId = null;
  }
  
  messages.push(newMessage);
  return newMessage;
}

//editing feature
function updateMessage(id, username, text) {
  const message = messages.find(m=>m.id === + id);
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
  getMessages,
  addReaction,
  removeReaction,
  listRoots,
  listThread,
  getMessagesByChannel,
  forwardMessage,
  updateMessage,
};