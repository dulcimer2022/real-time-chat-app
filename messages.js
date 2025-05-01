import mongoose from 'mongoose';
import Message from './models/Message.js';
import { EMOJI } from './emoji.js'; // Server-side emoji

// Utility function to convert MongoDB documents to client-friendly objects
function documentToObject(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id && !obj.id) {
    obj.id = obj._id.toString();
  }
  return obj;
}

async function addReaction(id, username, key) {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    if (!username || !key) return null;
    if (!Object.keys(EMOJI).includes(key)) {
      console.error(`Invalid emoji key: ${key}`);
      return null;
    }
    const message = await Message.findByIdAndUpdate(
      id,
      {
        $addToSet: { [`reactions.${key}`]: username },
      },
      { new: true }
    );
    if (!message) return null;
    return documentToObject(message);
  } catch (err) {
    console.error('Error adding reaction:', err);
    return null;
  }
}

async function removeReaction(id, username, key) {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    if (!username || !key) return null;
    if (!Object.keys(EMOJI).includes(key)) {
      console.error(`Invalid emoji key: ${key}`);
      return null;
    }
    let message = await Message.findByIdAndUpdate(
      id,
      {
        $pull: { [`reactions.${key}`]: username },
      },
      { new: true }
    );
    if (!message) return null;
    if (message.reactions[key]?.length === 0) {
      message = await Message.findByIdAndUpdate(
        id,
        {
          $unset: { [`reactions.${key}`]: 1 },
        },
        { new: true }
      );
    }
    return documentToObject(message);
  } catch (err) {
    console.error('Error removing reaction:', err);
    return null;
  }
}

async function addMessage(username, text, options = {}) {
  const { threadId = null, parentId = null, channelId = 'public', originalMessage = null } = options;
  const isForwarded = !!originalMessage;
  const message = await Message.create({
    username,
    text,
    parentId,
    threadId,
    channelId,
    isForwarded,
    originalMessage,
  });
  return documentToObject(message);
}

async function getMessage(id) {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const message = await Message.findById(id);
    return documentToObject(message);
  } catch (err) {
    console.error('Error finding message:', err);
    return null;
  }
}

async function listRoots(channelId = 'public') {
  try {
    const roots = await Message.find({ channelId, threadId: null })
      .sort({ timestamp: -1 });
    return roots.map(root => documentToObject(root));
  } catch (err) {
    console.error('Error listing roots:', err);
    return [];
  }
}

async function listThread(tid) {
  try {
    if (!mongoose.Types.ObjectId.isValid(tid)) return [];
    const root = await Message.findById(tid);
    if (!root) return [];
    const replies = await Message.find({ threadId: tid, _id: { $ne: tid } })
      .sort({ timestamp: 1 });
    return [root, ...replies].map(msg => documentToObject(msg));
  } catch (err) {
    console.error('Error listing thread:', err);
    return [];
  }
}

async function forwardMessage(username, originalMessageId, comment = '', options = {}) {
  const { channelId = 'public', threadId = null } = options;
  try {
    if (!mongoose.Types.ObjectId.isValid(originalMessageId)) return null;
    const originalMessage = await Message.findById(originalMessageId);
    if (!originalMessage) return null;
    const messageText = comment.trim() || " ";
    const forwardedMessage = await addMessage(
      username,
      messageText,
      {
        threadId,
        channelId,
        isForwarded: true,
        originalMessage: {
          id: originalMessage._id.toString(),
          username: originalMessage.username,
          text: originalMessage.text
        }
      }
    );
    return forwardedMessage;
  } catch (err) {
    console.error('Error forwarding message:', err);
    return null;
  }
}

async function updateMessage(id, username, text) {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const message = await Message.findById(id);
    if (!message) return null;
    if (message.username !== username) return { error: 'not-authorized' };
    message.text = text;
    message.edited = true;
    await message.save();
    return documentToObject(message);
  } catch (err) {
    console.error('Error updating message:', err);
    return null;
  }
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