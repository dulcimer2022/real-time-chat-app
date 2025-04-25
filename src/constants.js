export const SERVER = {
    AUTH_MISSING: 'auth-missing',
    AUTH_INSUFFICIENT: 'auth-insufficient',
    REQUIRED_USERNAME: 'required-username',
    
    USER_EXISTS: 'user-exists',
    USER_NOT_REGISTERED: 'user-not-registered',
    INVALID_USERNAME: 'invalid-username',

    REQUIRED_MESSAGE: 'required-message',
    NOT_AUTHORIZED: 'not-authorized',
    NO_SUCH_MESSAGE: 'no-such-message',

    INVALID_TID:    'invalid-tid',
    NO_SUCH_THREAD: 'noSuchThread',
    NO_SUCH_ID:    'noSuchId',

    REQUIRED_NAME: 'required-name',
    INVALID_CHANNEL_NAME: 'invalid-channel-name',
    CHANNEL_EXISTS: 'channel-exists',
    NO_SUCH_CHANNEL: 'no-such-channel',
  };
  
export const MESSAGES = {
    [SERVER.AUTH_MISSING]: 'You must be logged in to chat!',
    [SERVER.AUTH_INSUFFICIENT]: 'Not authorized to perform this action. Use other account like admin',
    [SERVER.REQUIRED_USERNAME]: 'Please enter a username',
    [SERVER.REQUIRED_MESSAGE]: 'Message cannot be empty',
    [SERVER.USER_EXISTS]: 'Username already taken. Please login directly or choose another name.',
    [SERVER.USER_NOT_REGISTERED]: 'No such user. Please register first.',
    [SERVER.INVALID_USERNAME]   : 'Please enter a valid username with only letters and numbers',

    [SERVER.NOT_AUTHORIZED]: 'You can only edit your own messages',
    [SERVER.NO_SUCH_MESSAGE]: 'The message you are trying to edit does not exist',

    [SERVER.INVALID_TID]:    'Invalid thread identifier.',
    [SERVER.NO_SUCH_THREAD]: 'That thread doesn’t exist.',
    [SERVER.NO_SUCH_ID]:  'That message does not exist.',

    [SERVER.REQUIRED_NAME]: 'Channel name is required',
    [SERVER.INVALID_CHANNEL_NAME]: 'Channel name must be 2-20 characters and contain only lowercase letters, numbers, hyphens, and underscores',
    [SERVER.CHANNEL_EXISTS]: 'A channel with this name already exists',
    [SERVER.NO_SUCH_CHANNEL]: 'Channel not found',
    'default': 'Something went wrong. Please try again',
    'networkError': 'Unable to connect to the server. Please try again',
    'registration-success': 'Registration successful! Please log in.',
    'channel-creation-success': 'Channel created successfully!',
};
  
export const LOGIN_STATUS = {
    PENDING: 'pending',
    NOT_LOGGED_IN: 'notLoggedIn',
    IS_LOGGED_IN: 'loggedIn',
};
  
export const CLIENT = {
    NETWORK_ERROR: 'networkError',
    NO_SESSION: 'noSession',
};

export const EMOJI = {
      smile: '😅',   // U+1F605
      devil: '😈',   // U+1F608
      cool:  '🤣',   // U+1F60E
      angry: '😡',   // U+1F621
      tired: '😫',   // U+1F62B
      rofl:  '🤣',   // U+1F923
};
    
export const DEFAULT_EMOJI_KEYS = Object.keys(EMOJI);  