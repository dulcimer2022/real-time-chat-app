// using helper to avoid duplicate
function onNetwork(){ 
  return Promise.reject({ error:'networkError' });
}

function handleJson(res) {
  if (res.ok) return res.json();
  return res.json().then(e => Promise.reject(e));
}

export function register(username){
    return fetch('/api/v1/register',{
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body: JSON.stringify({ username }),
    })
    .catch(onNetwork)
    .then(handleJson);
}

export function login(username) {
  return fetch('/api/v1/session', {
    method: 'POST',
    headers: new Headers({
        'content-type': 'application/json',}),
    body: JSON.stringify({ username }),
    })
    .catch(onNetwork)
    .then(handleJson);
}

export function fetchSession() {
    return fetch('/api/v1/session')
    .catch(onNetwork)
    .then(handleJson);
  }
  
export function logout() {
  return fetch('/api/v1/session', {
    method: 'DELETE',
  })
  .catch(onNetwork)
  .then(handleJson);
}

export function fetchUsers() {
  return fetch('/api/v1/users')
  .catch(onNetwork)
  .then(handleJson);
}

//emoji reactions
export function addReaction(id, key){
  return fetch(`/api/v1/messages/${id}/reactions`,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body: JSON.stringify({ key }),
  })
  .catch(onNetwork)
  .then(handleJson);
}
  
export function removeReaction(id, key){
  return fetch(`/api/v1/messages/${id}/reactions/${key}`,{ 
      method:'DELETE' })
      .catch(onNetwork)
      .then(handleJson);
} 
  
//threads functions 
export function fetchRoots(channelId = 'public') {
  return fetch(`/api/v1/messages?channelId=${channelId}`)
  .catch(onNetwork)
  .then(handleJson);
}

export function fetchThread(tid) {
  if (tid === null || tid === undefined) {
    return Promise.reject({ error: 'invalid-tid' });
  }
  
  return fetch(`/api/v1/threads/${tid}`)
  .catch(onNetwork)
  .then(handleJson);
}
  
export function createRoot(text, channelId = 'public') {
  return fetch('/api/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, channelId }),
  })
  .catch(onNetwork)
  .then(handleJson);
}
  
export function replyThread(tid, text, parentId = null) {

  if (tid === null || tid === undefined) {
    return Promise.reject({ error: 'invalid-tid' });
  }
  
  return fetch(`/api/v1/threads/${tid}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, parentId }),
  })
  .catch(onNetwork)
  .then(handleJson);
}

//channels functions
export function fetchChannels() {
  return fetch('/api/v1/channels')
    .catch(onNetwork)
    .then(handleJson);
}

export function createChannel(name, description = '') {
  return fetch('/api/v1/channels', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ name, description })
  })
  .catch(onNetwork)
  .then(handleJson);
}

//forwarding feature
export function forwardMessage(id, comment = '', channelId = 'public', threadId = null) {
  return fetch(`/api/v1/messages/${id}/forward`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ comment, channelId, threadId }),
  })
  .catch(onNetwork)
  .then(handleJson);
}

//editing
export function updateMessage(id, text) {
  return fetch(`/api/v1/messages/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
  .catch(onNetwork)
  .then(handleJson);
}
  


