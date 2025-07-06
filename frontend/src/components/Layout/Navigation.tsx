import React from 'react';
import { Upload, Share2, Download, History } from 'lucide-react';

interface NavigationProps {
  activeTab: 'upload' | 'transfer' | 'receive' | 'history';
  onTabChange: (tab: 'upload' | 'transfer' | 'receive' | 'history') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'transfer', label: 'Transfer', icon: Share2 },
    { id: 'receive', label: 'Receive', icon: Download },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <nav className="flex justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};