import React from 'react';
import { BookOpen, Upload, User, Sun, Moon, Library, FileText, LogOut } from "lucide-react";

const Header = ({ darkMode, setDarkMode, handleUploadClick, isAdmin, activeTab, setActiveTab, handleLogout }) => {
  return (
    <header className={`${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-indigo-600'} text-white p-6 shadow-md transition-colors duration-200`}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold flex items-center mr-8">
            <BookOpen size={24} className="mr-2" />
            BookVault Pro
          </h1>
          
          <nav className="hidden md:flex space-x-2">
            <button 
              className={`px-4 py-2 rounded-md flex items-center transition-colors duration-200 ${
                activeTab === 'library' 
                  ? darkMode
                    ? 'bg-indigo-500 text-white font-medium'
                    : 'bg-white text-indigo-700 font-medium'
                  : 'text-white hover:bg-indigo-700'
              }`}
              onClick={() => setActiveTab('library')}
            >
              <Library size={18} className="mr-1" />
              Library
            </button>
            
            <button 
              className={`px-4 py-2 rounded-md flex items-center transition-colors duration-200 ${
                activeTab === 'reader' 
                  ? darkMode
                    ? 'bg-indigo-500 text-white font-medium'
                    : 'bg-white text-indigo-700 font-medium'
                  : 'text-white hover:bg-indigo-700'
              } ${!activeTab === 'reader' ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setActiveTab('reader')}
              disabled={activeTab !== 'reader'}
            >
              <FileText size={18} className="mr-1" />
              Reader
            </button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className={`flex items-center transition-colors duration-200 ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-indigo-700 hover:bg-indigo-800'
            } px-4 py-2 rounded-md text-base`}
            onClick={handleUploadClick}
          >
            <Upload size={18} className="mr-2" />
            Upload PDF
          </button>
          
          <div className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
            darkMode ? 'bg-gray-700' : 'bg-indigo-700'
          } text-base`}>
            <User size={18} className="mr-2" />
            <span className="font-medium">{isAdmin ? 'Admin' : 'User'}</span>
          </div>
          
          {isAdmin && (
            <button 
              className={`flex items-center transition-colors duration-200 ${
                darkMode 
                  ? 'bg-red-700 hover:bg-red-600' 
                  : 'bg-red-600 hover:bg-red-700'
              } px-3 py-2 rounded-md text-base`}
              onClick={handleLogout}
              title="Log out from admin mode"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          )}
          
          <button 
            className={`p-2 rounded-full transition-colors duration-200 ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-indigo-700 hover:bg-indigo-800'
            }`}
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
