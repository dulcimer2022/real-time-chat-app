import Channel from './models/Channel.js';

async function initializeChannels() {
  try {
    
    const publicChannel = await Channel.findOne({ id: 'public' });
    const introChannel = await Channel.findOne({ id: 'introduction' });
    
    let created = 0;
    
    if (!publicChannel) {
      await Channel.create({ id: 'public', name: 'public' });
      created++;
    }
    
    if (!introChannel) {
      await Channel.create({ id: 'introduction', name: 'introduction' });
      created++;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function getChannels() {
  return await Channel.find({});
}
  
async function getChannel(channelId) {
  return await Channel.findOne({ id: channelId });
}
  
async function createChannel(name, username) {
  if (username !== 'admin') {
    return { ok: false, error: 'auth-insufficient' };
  }
  
  if (!name.match(/^[a-z0-9-_]{2,20}$/)) {
    return { ok: false, error: 'invalid-channel-name' };
  }
  
  const existingChannel = await Channel.findOne({ name });
  if (existingChannel) {
    return { ok: false, error: 'channel-exists' };
  }
  
  const newChannel = await Channel.create({
    id: name,
    name,
  });
  
  return { ok: true, channel: newChannel };
}
  
export default {
  getChannels,
  getChannel,
  createChannel,
  initializeChannels 
};