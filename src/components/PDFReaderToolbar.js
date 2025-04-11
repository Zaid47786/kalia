import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Custom toolbar to add to the PDF viewer
const PDFReaderToolbar = ({ currentPage, numPages, handlePreviousPage, handleNextPage }) => {
  return (
    <div className="pdf-toolbar flex items-center gap-2 p-2 bg-white shadow-md rounded-md mb-2">
      {/* Previous page button */}
      <button 
        onClick={handlePreviousPage}
        className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
        disabled={currentPage <= 1}
        title="Previous page"
      >
        <ChevronLeft size={18} />
      </button>
      
      {/* Page information */}
      <span className="text-sm font-medium">
        Page {currentPage} of {numPages || '?'}
      </span>
      
      {/* Next page button */}
      <button 
        onClick={handleNextPage}
        className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
        disabled={numPages && currentPage >= numPages}
        title="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default PDFReaderToolbar; 