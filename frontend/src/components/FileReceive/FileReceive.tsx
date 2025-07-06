import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, XCircle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

export const FileReceive: React.FC = () => {
  const [code, setCode] = useState('');
  const [fileInfo, setFileInfo] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'searching' | 'initiated' | 'ready' | 'downloading' | 'completed' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { token } = useAuth();
  const { socket } = useSocket();

  // join socket room when we have code
  useEffect(() => {
    if (socket && code.length === 8) {
      socket.emit('join_transfer_room', code);

      socket.off('transfer_initiated');
      socket.off('transfer_complete');

      socket.on('transfer_initiated', (data) => {
        if (data.transferCode === code) {
          setStatus('initiated');
        }
      });
      socket.on('transfer_complete', (data) => {
        if (data.transferCode === code) {
          // file finished transferring, start download automatically
          downloadFile();
        }
      });
    }
  }, [socket, code]);

  const lookupFile = async () => {
    if (!code.trim()) return;

    setStatus('searching');
    setErrorMsg('');
    setFileInfo(null);

    try {
      const resp = await fetch(`http://localhost:3001/api/files/transfer/${code}`);
      if (!resp.ok) {
        setStatus('error');
        setErrorMsg('File not found');
        return;
      }
      const data = await resp.json();
      setFileInfo(data.file);

      if (data.file.transfer_status !== 'completed') {
        setStatus('error');
        setErrorMsg(`File transfer is ${data.file.transfer_status.replace('_', ' ')}`);
        return;
      }

      setStatus('ready');

      // join the socket room proactively (in case not already)
      if (socket) {
        socket.emit('join_transfer_room', code);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Lookup failed');
    }
  };

  const downloadFile = async () => {
    if (!fileInfo) return;

    setStatus('downloading');
    try {
      const url = `http://localhost:3001/api/files/download/${code}`;
      // Use anchor trick for browser download handling auth token if any
      const anchor = document.createElement('a');
      anchor.href = url + (token ? `?token=${token}` : '');
      anchor.target = '_blank';
      anchor.click();
      setStatus('completed');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Download failed');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Receive File</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter transfer code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 tracking-widest text-center"
          />
          <button
            onClick={lookupFile}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
          >
            Search
          </button>

          {status === 'initiated' && (
            <div className="flex items-center justify-center space-x-2 text-yellow-300">
              <span className="font-medium">Sender has started the transfer. Waiting for data…</span>
            </div>
          )}

          {status === 'ready' && fileInfo && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 flex flex-col text-center">
                <span className="text-white font-medium text-lg">{fileInfo.original_name}</span>
                <span className="text-gray-400 text-sm">{(fileInfo.file_size / (1024*1024)).toFixed(2)} MB</span>
              </div>
              <button
                onClick={downloadFile}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex justify-center items-center space-x-2"
              >
                <Download className="w-5 h-5" /> <span>Download</span>
              </button>
            </div>
          )}

          {status === 'completed' && (
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>Download started!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center justify-center space-x-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
