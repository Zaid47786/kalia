import React from 'react';
import { X, FileText, Bookmark } from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentPDF, currentPage, setCurrentPage }) => {
  // Generate a table of contents based on the number of pages
  const generateTOC = () => {
    if (!currentPDF || !currentPDF.pages) return [];
    
    // Create a simple TOC with page numbers
    // In a real app, this would be extracted from the PDF metadata
    const toc = [];
    const pageCount = currentPDF.pages;
    
    // Add some dummy sections
    const sections = [
      { title: 'Introduction', page: 1 },
      { title: 'Executive Summary', page: Math.min(2, pageCount) },
      { title: 'Market Analysis', page: Math.min(3, pageCount) },
      { title: 'Financial Projections', page: Math.min(4, pageCount) },
      { title: 'Conclusion', page: Math.min(pageCount, 5) }
    ];
    
    // Only include sections that are within the page range
    return sections.filter(section => section.page <= pageCount);
  };
  
  const toc = generateTOC();
  
  // Handle bookmark creation (simplified)
  const addBookmark = () => {
    alert(`Bookmarked page ${currentPage} in ${currentPDF.name}`);
  };
  
  return (
    <div className={`w-64 bg-gray-800 text-white p-4 h-full overflow-y-auto`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Document Outline</h2>
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>
      
      {currentPDF && (
        <>
          <div className="mb-6">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Document Info</h3>
            <div className="bg-gray-700 rounded-md p-3">
              <p className="text-sm mb-1"><strong>Name:</strong> {currentPDF.name}</p>
              <p className="text-sm mb-1"><strong>Pages:</strong> {currentPDF.pages || 'Unknown'}</p>
              <p className="text-sm"><strong>Added:</strong> {currentPDF.date || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm uppercase tracking-wider text-gray-400">Table of Contents</h3>
              <button 
                onClick={addBookmark}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
                title="Bookmark current page"
              >
                <Bookmark size={16} />
              </button>
            </div>
            <ul className="space-y-1">
              {toc.map((section, index) => (
                <li 
                  key={index} 
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    currentPage === section.page ? 'bg-indigo-600' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setCurrentPage(section.page)}
                >
                  <div className="flex justify-between items-center">
                    <span>{section.title}</span>
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded">p.{section.page}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Page Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: currentPDF.pages || 1 }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`p-2 text-center rounded ${
                    currentPage === page 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      {!currentPDF && (
        <div className="text-center py-8">
          <FileText size={32} className="mx-auto text-gray-500 mb-2" />
          <p className="text-gray-400">No document selected</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;