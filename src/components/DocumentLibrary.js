import React from 'react';
import { Trash2, Search, FileText, Shield, BookOpen, GraduationCap, Filter } from 'lucide-react';

const DocumentLibrary = ({ documents, searchQuery, setSearchQuery, openDocument, deleteDocument, isAdmin }) => {
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full rounded-lg shadow-lg p-3 sm:p-4 md:p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold">Your Document Library</h2>
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search documents..."
            className="pl-10 pr-4 py-2 sm:py-3 rounded-full w-full sm:w-64 md:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No Documents Yet</h3>
          <p className="text-gray-500">{isAdmin ? 'Upload your first PDF to get started' : 'No PDFs have been uploaded yet'}</p>
          {!isAdmin && (
            <p className="mt-2 text-sm text-indigo-600">
              <Shield size={16} className="inline mr-1" />
              Only administrators can upload PDFs
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 md:gap-6">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="p-4 sm:p-6 rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start">
                <h3 className="text-lg sm:text-xl font-medium text-indigo-700 line-clamp-2">{doc.name}</h3>
                {isAdmin && (
                  <button 
                    onClick={() => deleteDocument(doc.id)}
                    className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0"
                    title="Delete document"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              
              {/* Category and Subject Information */}
              {(doc.category_id || doc.subject_id) && (
                <div className="mt-2 mb-3">
                  {doc.category_id && (
                    <div className="flex items-center text-sm text-indigo-600 mb-1">
                      <GraduationCap size={14} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{doc.category_name || (doc.category_id === 1 ? 'CLASS 9' : 'CLASS 10')}</span>
                    </div>
                  )}
                  {doc.subject_id && (
                    <div className="flex items-center text-sm text-green-600">
                      <BookOpen size={14} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{doc.subject_name || 'Subject'}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-2 text-sm sm:text-base text-gray-600">
                <p>Pages: {doc.pages}</p>
                <p>Owner: {doc.owner_name || doc.owner || 'Admin'}</p>
                <p>Date Added: {doc.upload_date || doc.date}</p>
              </div>
              <div className="mt-4">
                <button 
                  className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
                  onClick={() => openDocument(doc)}
                >
                  Open Document
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">No documents match your search.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 inline-flex items-center"
          >
            <Filter size={16} className="mr-2" />
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;