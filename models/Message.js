import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: function() { return !this.isForwarded; },
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  channelId: {
    type: String,
    default: 'public',
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  reactions: {
    type: Object,
    default: {},
  },
  isForwarded: {
    type: Boolean,
    default: false,
  },
  originalMessage: {
    type: Object,
    default: null,
  },
  edited: {
    type: Boolean,
    default: false,
  },
});

const Message = mongoose.model('Message', messageSchema);

export default Message;