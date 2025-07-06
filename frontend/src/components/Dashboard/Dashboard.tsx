import React, { useState, useEffect } from 'react';
import { FileUpload } from '../FileUpload/FileUpload';
import { FileTransfer } from '../FileTransfer/FileTransfer';
import { FileHistory } from '../FileHistory/FileHistory';
import { FileReceive } from '../FileReceive/FileReceive';
import { Header } from '../Layout/Header';
import { Navigation } from '../Layout/Navigation';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'transfer' | 'receive' | 'history'>('upload');
  const [currentFile, setCurrentFile] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);

  const handleUploadComplete = (file: any) => {
    setCurrentFile(file);
    setActiveTab('transfer');
    fetchFiles();
  };

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/files/my-files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchReceived();
  }, []);

  // fetch files sent TO the current user
  const fetchReceived = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/files/received-files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReceivedFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch received files:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="mt-8">
          {activeTab === 'upload' && (
            <FileUpload onUploadComplete={handleUploadComplete} />
          )}
          
          {activeTab === 'transfer' && currentFile && (
            <FileTransfer file={currentFile} />
          )}
          
          {activeTab === 'receive' && (
            <FileReceive />
          )}

          {activeTab === 'history' && (
            <FileHistory files={[...files, ...receivedFiles]} />
          )}
        </div>
      </div>
    </div>
  );
};