import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // use environment variable or default to container service name
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/chatapp';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;