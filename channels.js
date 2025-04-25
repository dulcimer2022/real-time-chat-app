// Initial channels
const channels = [
    {
      id: 'public',
      name: 'public',
    },
    {
      id: 'introduction',
      name: 'introduction',
    }
  ];
  
  function getChannels() {
    return [...channels]; 
  }
  
  function getChannel(channelId) {
    return channels.find(channel => channel.id === channelId);
  }
  
  function createChannel(name, username) {
    if (username !== 'admin') {
      return { ok: false, error: 'auth-insufficient' };
    }
    
    if (!name.match(/^[a-z0-9-_]{2,20}$/)) {
      return { ok: false, error: 'invalid-channel-name' };
    }
    
    if (channels.some(channel => channel.name === name)) {
      return { ok: false, error: 'channel-exists' };
    }
    
    const newChannel = {
      id: name,
      name,
    };
    
    channels.push(newChannel);
    return { ok: true, channel: newChannel };
  }
  
  export default {
    getChannels,
    getChannel,
    createChannel
  };