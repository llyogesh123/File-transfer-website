import React, { useState, useEffect } from 'react';
import { Share2, Copy, Users, Download, CheckCircle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

interface FileTransferProps {
  file: any;
}

export const FileTransfer: React.FC<FileTransferProps> = ({ file }) => {
  const [transferCode, setTransferCode] = useState(file.transferCode || '');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'initiating' | 'in_progress' | 'completed'>('idle');
  const [copiedCode, setCopiedCode] = useState(false);
  const { socket } = useSocket();
  const { token } = useAuth();

  useEffect(() => {
    if (socket) {
      socket.on('transfer_progress', (data) => {
        setTransferProgress(data.progress);
        setTransferStatus('in_progress');
      });

      socket.on('transfer_complete', () => {
        setTransferStatus('completed');
        setTransferProgress(100);
      });

      socket.on('transfer_response', (data) => {
        if (data.success) {
          setTransferStatus('in_progress');
        }
      });

      return () => {
        socket.off('transfer_progress');
        socket.off('transfer_complete');
        socket.off('transfer_response');
      };
    }
  }, [socket]);

  const searchUsers = async (query: string) => {
    if (!query.trim() || !token) return;

    try {
      const response = await fetch(`https://file-transfer-website-2.onrender.com/api/files/search-users?q=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const initiateTransfer = () => {
    if (!socket || !selectedRecipient) return;

    setTransferStatus('initiating');
    socket.emit('initiate_transfer', {
      transferCode,
      recipientId: selectedRecipient.id
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
        <div className="text-center mb-6">
          <Share2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Share File</h2>
          <p className="text-gray-300 mt-2">Transfer your file securely to another user</p>
        </div>

        <div className="space-y-6">
          {/* Transfer Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transfer Code
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={transferCode}
                readOnly
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => copyToClipboard(transferCode)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg transition-colors"
              >
                {copiedCode ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Share this code with the recipient to allow them to download your file
            </p>
          </div>

          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Send to User
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Search users by username or email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white/5 rounded-lg border border-white/20 max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedRecipient(user);
                      setSearchQuery(user.username);
                      setSearchResults([]);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="text-white font-medium">{user.username}</div>
                    <div className="text-gray-400 text-sm">{user.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transfer Status */}
          {transferStatus !== 'idle' && (
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Transfer Status</span>
                <span className="text-gray-400">{transferStatus.replace('_', ' ')}</span>
              </div>
              
              {transferStatus === 'in_progress' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Progress</span>
                    <span>{Math.round(transferProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${transferProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {transferStatus === 'completed' && (
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Transfer completed successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Transfer Button */}
          {selectedRecipient && transferStatus === 'idle' && (
            <button
              onClick={initiateTransfer}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              <Download className="w-5 h-5 inline mr-2" />
              Send to {selectedRecipient.username}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};