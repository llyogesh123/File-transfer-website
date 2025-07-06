import crypto from 'crypto-js';
import File from '../models/File.js';
import TransferSession from '../models/TransferSession.js';
import fs from 'fs';
import path from 'path';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room for file transfers
    socket.on('join_transfer_room', (transferCode) => {
      socket.join(transferCode);
      console.log(`User ${socket.id} joined transfer room: ${transferCode}`);
    });

    // Handle file transfer initiation
    socket.on('initiate_transfer', async (data) => {
      try {
        const { transferCode, recipientId } = data;
        
        // Update file with recipient
        await File.findOneAndUpdate(
          { transferCode },
          { 
            recipientId,
            transferStatus: 'in_progress'
          }
        );

        // Create transfer session
        const file = await File.findOne({ transferCode });
        if (file) {
          const transferSession = new TransferSession({
            fileId: file._id,
            sessionId: transferCode,
            socketId: socket.id
          });
          await transferSession.save();
        }

        // Notify recipient
        socket.to(transferCode).emit('transfer_initiated', {
          transferCode,
          message: 'File transfer initiated'
        });

        socket.emit('transfer_response', { success: true, message: 'Transfer initiated' });

        // Start streaming the file from server to recipient
        const STREAM_CHUNK_SIZE = 256 * 1024; // 256KB
        if (file && fs.existsSync(file.uploadPath)) {
          const totalChunks = Math.ceil(file.fileSize / STREAM_CHUNK_SIZE);
          let sentChunks = 0;
          const readStream = fs.createReadStream(file.uploadPath, { highWaterMark: STREAM_CHUNK_SIZE });

          readStream.on('data', (chunkBuffer) => {
            const encryptedChunk = crypto.AES.encrypt(chunkBuffer.toString('base64'), 'transfer-secret').toString();
            const progress = ((sentChunks + 1) / totalChunks) * 100;

            io.to(transferCode).emit('receive_chunk', {
              chunk: encryptedChunk,
              chunkIndex: sentChunks,
              totalChunks,
              transferCode,
              progress
            });

            sentChunks += 1;
            // send to sender as well so their UI shows progress
            socket.emit('transfer_progress', {
              progress,
              chunkIndex: sentChunks - 1,
              totalChunks
            });
            io.to(transferCode).emit('transfer_progress', {
              progress,
              chunkIndex: sentChunks - 1,
              totalChunks
            });
          });

          readStream.on('end', async () => {
            await File.findOneAndUpdate(
              { transferCode },
              { transferStatus: 'completed' }
            );
            io.to(transferCode).emit('transfer_complete', {
              transferCode,
              message: 'File transfer completed successfully'
            });
          });
        }
      } catch (error) {
        console.error('Transfer initiation error:', error);
        socket.emit('transfer_response', { success: false, error: 'Failed to initiate transfer' });
      }
    });

    // Handle file chunk transfer
    socket.on('file_chunk', async (data) => {
      try {
        const { transferCode, chunk, chunkIndex, totalChunks, progress } = data;
        
        // Encrypt chunk for security
        const encryptedChunk = crypto.AES.encrypt(chunk, 'transfer-secret').toString();
        
        // Emit progress update
        socket.to(transferCode).emit('transfer_progress', {
          progress,
          chunkIndex,
          totalChunks
        });

        // Forward encrypted chunk to recipient
        socket.to(transferCode).emit('receive_chunk', {
          chunk: encryptedChunk,
          chunkIndex,
          totalChunks,
          transferCode
        });

        // Update transfer session
        await TransferSession.findOneAndUpdate(
          { sessionId: transferCode },
          { progress }
        );

        if (chunkIndex === totalChunks - 1) {
          // Transfer complete
          await File.findOneAndUpdate(
            { transferCode },
            { transferStatus: 'completed' }
          );

          await TransferSession.findOneAndUpdate(
            { sessionId: transferCode },
            { status: 'completed', progress: 100 }
          );

          socket.to(transferCode).emit('transfer_complete', {
            transferCode,
            message: 'File transfer completed successfully'
          });
        }
      } catch (error) {
        console.error('Chunk transfer error:', error);
        socket.emit('transfer_error', { error: 'Chunk transfer failed' });
      }
    });

    // Handle transfer completion acknowledgment
    socket.on('transfer_complete_ack', async (data) => {
      const { transferCode } = data;
      
      socket.to(transferCode).emit('transfer_acknowledged', {
        transferCode,
        message: 'Transfer completed and acknowledged'
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}