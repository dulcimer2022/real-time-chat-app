import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sid: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60, // 24 hours in seconds
  },
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;