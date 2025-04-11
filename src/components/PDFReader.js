import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { fullScreenPlugin } from "@react-pdf-viewer/full-screen";
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { rotatePlugin } from '@react-pdf-viewer/rotate';

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/full-screen/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";

import { ChevronLeft, ChevronRight, RotateCw, Maximize2, Minimize2, Search, ZoomIn, ZoomOut } from 'lucide-react';

const PDFReader = forwardRef(({ currentPDF, onPageChange }, ref) => {
  const [rotation, setRotation] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const documentRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    rotateClockwise,
    rotateCounterClockwise,
    handleFullScreen
  }));

  // Reset state when PDF changes
  useEffect(() => {
    if (currentPDF) {
      console.log('Current PDF changed:', currentPDF.name, currentPDF.url);
      setPdfError(null);
      setCurrentPage(1);
      setIsLoading(true);
      setNumPages(null);
      setRotation(0);
      setScale(1);
      documentRef.current = null;
    }
  }, [currentPDF]);

  // Handle mouse movement for controls visibility
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, []);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Create plugins
  const fullScreenPluginInstance = fullScreenPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin({
    enableShortcuts: true,
  });
  const searchPluginInstance = searchPlugin();
  const zoomPluginInstance = zoomPlugin();
  const rotatePluginInstance = rotatePlugin();
  
  // Create layout with properly integrated navigation
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    toolbarPlugin: {
      fullScreenPlugin: {
        FullScreenButton: () => null,
      },
      pageNavigationPlugin: {
        ShowGoToNextPage: true,
        ShowGoToPreviousPage: true,
        ShowCurrentPageInput: true,
        ShowNumberOfPages: true,
      },
    },
  });

  if (!currentPDF) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No PDF selected</p>
          <p className="text-gray-400 text-sm mt-2">Please choose a document from the library</p>
        </div>
      </div>
    );
  }

  if (!currentPDF.url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">PDF URL is missing</p>
          <p className="text-gray-400 text-sm mt-2">Please select a valid PDF document</p>
        </div>
      </div>
    );
  }

  if (pdfError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-6">
        <div className="text-center text-red-500 p-4 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Error Loading PDF</h3>
          <p className="mb-4">{pdfError}</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
            onClick={() => setPdfError(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handlePageChange = (e) => {
    if (e && typeof e.currentPage === 'number' && documentRef.current) {
      const totalPages = documentRef.current.numPages;
      const newPage = Math.min(Math.max(1, e.currentPage), totalPages);
      setCurrentPage(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  };

  const rotateClockwise = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const rotateCounterClockwise = () => {
    setRotation((prevRotation) => (prevRotation - 90 + 360) % 360);
  };

  const handleNextPage = () => {
    if (documentRef.current && currentPage < documentRef.current.numPages) {
      const nextPage = Math.min(currentPage + 1, documentRef.current.numPages);
      setCurrentPage(nextPage);
      if (onPageChange) {
        onPageChange(nextPage);
      }
      
      if (viewerRef.current) {
        viewerRef.current.setCurrentPage(nextPage - 1);
      }
    }
  };

  const handlePreviousPage = () => {
    if (documentRef.current && currentPage > 1) {
      const prevPage = Math.max(1, currentPage - 1);
      setCurrentPage(prevPage);
      if (onPageChange) {
        onPageChange(prevPage);
      }
      
      if (viewerRef.current) {
        viewerRef.current.setCurrentPage(prevPage - 1);
      }
    }
  };

  const handleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
          .then(() => setIsFullScreen(false))
          .catch(err => console.error('Error exiting fullscreen:', err));
      } else {
        containerRef.current.requestFullscreen()
          .then(() => setIsFullScreen(true))
          .catch(err => console.error('Error entering fullscreen:', err));
      }
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleDocumentLoad = (e) => {
    if (e && e.doc) {
      documentRef.current = e.doc;
      const actualPages = e.doc.numPages;
      console.log('Document loaded with actual pages:', actualPages);
      setNumPages(actualPages);
      setIsLoading(false);
      
      // Ensure current page is within bounds
      if (currentPage > actualPages) {
        setCurrentPage(actualPages);
        if (onPageChange) {
          onPageChange(actualPages);
        }
      }
    }
  };

  const handleError = (error) => {
    console.error('PDF loading error:', error);
    setPdfError('Failed to load PDF document. Please try again.');
    setIsLoading(false);
    documentRef.current = null;
  };

  return (
    <div className="flex flex-col h-full w-full relative" ref={containerRef}>
      {/* Header */}
      <div className={`transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mb-2 sm:mb-4 p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-lg sm:text-xl font-semibold truncate text-gray-800">{currentPDF.name}</h2>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center mr-3 bg-gray-100 rounded-lg overflow-hidden">
              <button 
                onClick={handlePreviousPage}
                className="px-2 py-1.5 hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage <= 1}
                title="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-2 py-1 text-sm font-medium">
                {currentPage} / {numPages || '?'}
              </span>
              <button 
                onClick={handleNextPage}
                className="px-2 py-1.5 hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={numPages && currentPage >= numPages}
                title="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button 
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
                disabled={scale <= 0.5}
              >
                <ZoomOut size={18} />
              </button>
              <span className="px-2 py-1 text-sm font-medium">{Math.round(scale * 100)}%</span>
              <button 
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
                disabled={scale >= 2}
              >
                <ZoomIn size={18} />
              </button>
            </div>
            
            <button 
              onClick={rotateClockwise}
              className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Rotate clockwise"
            >
              <RotateCw size={18} />
            </button>
            
            <button 
              onClick={handleFullScreen}
              className="p-1.5 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
              title="Toggle fullscreen"
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-grow flex items-center justify-center bg-gray-100 rounded-lg overflow-auto relative shadow-inner">
        <div className="w-full h-full" id="pdf-document-container">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <Viewer
              key={currentPDF.url}
              fileUrl={currentPDF.url}
              plugins={[
                defaultLayoutPluginInstance,
                fullScreenPluginInstance,
                pageNavigationPluginInstance,
                searchPluginInstance,
                zoomPluginInstance,
                rotatePluginInstance,
              ]}
              onPageChange={handlePageChange}
              rotation={rotation}
              defaultScale={scale}
              onDocumentLoad={handleDocumentLoad}
              onError={handleError}
              ref={viewerRef}
              renderLoader={(percentages) => (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 border-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading document: {Math.round(percentages)}%</p>
                </div>
              )}
            />
          </Worker>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className={`transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} mt-3 flex justify-center items-center md:hidden`}>
        <div className="bg-white rounded-lg shadow-md p-1 flex items-center">
          <button 
            onClick={handlePreviousPage}
            className="px-3 py-2 rounded-l-md bg-gray-50 hover:bg-gray-100 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={isSmallScreen ? 16 : 18} className="mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="px-4 py-2 font-medium">
            Page {currentPage}{numPages ? ` of ${numPages}` : ''}
          </span>
          <button 
            onClick={handleNextPage}
            className="px-3 py-2 rounded-r-md bg-gray-50 hover:bg-gray-100 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={numPages && currentPage >= numPages}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={isSmallScreen ? 16 : 18} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default PDFReader;
