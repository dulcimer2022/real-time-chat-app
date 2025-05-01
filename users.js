import User from './models/User.js';

async function isValid(username) {
    let isValid = true;
    isValid = !!username && username.trim();
    isValid = isValid && username.match(/^[A-Za-z0-9_]+$/);
    return isValid;
  }

async function register(username) {
    if (!await isValid(username)) {
      return { ok: false, error: 'invalid-username' };
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return { ok: false, error: 'user-exists' };
    }
    
    await User.create({ username });
    return { ok: true };
}

async function isRegistered(username) {
    const user = await User.findOne({ username });
    return !!user;
}
  
export default {
    isValid,
    register,
    isRegistered,
};

