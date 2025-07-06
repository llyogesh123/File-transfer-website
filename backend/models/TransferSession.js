import mongoose from 'mongoose';

const transferSessionSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  socketId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed'],
    default: 'active'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

export default mongoose.model('TransferSession', transferSessionSchema);