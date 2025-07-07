import { Calendar, Clock, Download, File, Share2, User } from 'lucide-react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface FileHistoryProps {
  files: any[];
}

export const FileHistory: React.FC<FileHistoryProps> = ({ files }) => {
  const { token, user } = useAuth();
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Download className="w-4 h-4" />;
      case 'in_progress': return <Share2 className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <File className="w-6 h-6 mr-2" />
          File History
        </h2>
        
        {files.length === 0 ? (
          <div className="text-center py-12">
            <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No files uploaded yet</p>
            <p className="text-gray-500 text-sm mt-2">Upload your first file to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-500/20 p-3 rounded-lg">
                      <File className="w-6 h-6 text-purple-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-1">
                        {file.original_name}
                      </h3>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{file.sender_username}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <File className="w-4 h-4" />
                          <span>{formatFileSize(file.file_size)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4">
                        {file.transfer_status === 'completed' && file.sender_id !== (user?.id ?? '') && (
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `https://file-transfer-website-2.onrender.com/api/files/download/${file.transfer_code}${token ? `?token=${token}` : ''}`;
                              link.target = '_blank';
                              link.click();
                            }}
                            className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        )}
                        <div className="bg-white/10 px-3 py-1 rounded-full">
                          <span className="text-white text-sm font-medium">
                            Code: {file.transfer_code}
                          </span>
                        </div>
                        
                        <div className={`flex items-center space-x-1 ${getStatusColor(file.transfer_status)}`}>
                          {getStatusIcon(file.transfer_status)}
                          <span className="text-sm font-medium capitalize">
                            {file.transfer_status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};