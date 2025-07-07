import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import File from '../models/File.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const transferCode = uuidv4().substring(0, 8).toUpperCase();

    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadPath: req.file.path,
      senderId: req.user._id,
      transferCode
    });

    await file.save();

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        filename: file.originalName,
        size: file.fileSize,
        transferCode: file.transferCode
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get user's uploaded files
router.get('/my-files', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ senderId: req.user._id })
      .populate('senderId', 'username')
      .sort({ createdAt: -1 });

    const formattedFiles = files.map(file => ({
      id: file._id,
      filename: file.filename,
      original_name: file.originalName,
      file_size: file.fileSize,
      mime_type: file.mimeType,
      upload_path: file.uploadPath,
      sender_id: file.senderId._id,
      sender_username: file.senderId.username,
      recipient_id: file.recipientId,
      transfer_status: file.transferStatus,
      transfer_code: file.transferCode,
      created_at: file.createdAt
    }));

    res.json({ files: formattedFiles });
  } catch (error) {
    console.error('Fetch files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file by transfer code
router.get('/transfer/:code', async (req, res) => {
  try {
    const file = await File.findOne({ transferCode: req.params.code })
      .populate('senderId', 'username');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const formattedFile = {
      id: file._id,
      filename: file.filename,
      original_name: file.originalName,
      file_size: file.fileSize,
      mime_type: file.mimeType,
      upload_path: file.uploadPath,
      sender_id: file.senderId._id,
      sender_username: file.senderId.username,
      recipient_id: file.recipientId,
      transfer_status: file.transferStatus,
      transfer_code: file.transferCode,
      created_at: file.createdAt
    };

    res.json({ file: formattedFile });
  } catch (error) {
    console.error('Fetch file error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Search users
router.get('/search-users', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email')
    .limit(10);

    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Download file by transfer code
router.get('/download/:code', async (req, res) => {
  try {
    const file = await File.findOne({ transferCode: req.params.code });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // If transfer not completed yet, let client know it is still in progress
    if (file.transferStatus !== 'completed') {
      return res.status(409).json({ error: `Transfer ${file.transferStatus.replace('_', ' ')}` });
    }

    return res.download(file.uploadPath, file.originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete file by id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    // Only sender or recipient may delete
    if (file.senderId.toString() !== req.user._id.toString() && file.recipientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Remove from disk if exists
    try {
      await fs.promises.unlink(file.uploadPath);
    } catch (e) {
      console.warn('File unlink', e.message);
    }
    await file.deleteOne();
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get files sent to current user (received)
router.get('/received-files', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ recipientId: req.user._id })
      .populate('senderId', 'username')
      .sort({ createdAt: -1 });

    const formattedFiles = files.map(file => ({
      id: file._id,
      filename: file.filename,
      original_name: file.originalName,
      file_size: file.fileSize,
      mime_type: file.mimeType,
      upload_path: file.uploadPath,
      sender_id: file.senderId._id,
      sender_username: file.senderId.username,
      recipient_id: file.recipientId,
      transfer_status: file.transferStatus,
      transfer_code: file.transferCode,
      created_at: file.createdAt
    }));

    res.json({ files: formattedFiles });
  } catch (error) {
    console.error('Fetch received files error:', error);
    res.status(500).json({ error: 'Failed to fetch received files' });
  }
});

export { router as fileRoutes };