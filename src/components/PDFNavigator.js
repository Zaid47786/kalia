import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { fullScreenPlugin } from "@react-pdf-viewer/full-screen";
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import fixPDFNavigation from './PDFNavigator';
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/full-screen/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

const PDFReader = forwardRef(({ currentPDF, currentPage, setCurrentPage, toggleFullScreen }, ref) => {
  const [rotation, setRotation] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const pdfNavigator = useRef(fixPDFNavigation());

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
      setNumPages(0); // Reset page count
    }
  }, [currentPDF, setCurrentPage]);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Disable scrolling and setup navigation after PDF loads
  useEffect(() => {
    // Setup when PDF is loaded
    if (!isLoading && numPages > 0) {
      // Try to disable scrolling
      const disableScrolling = () => {
        const pdfContainer = document.getElementById('pdf-document-container');
        if (pdfContainer) {
          // Find scrollable elements
          const scrollables = pdfContainer.querySelectorAll('.rpv-core__viewer, .rpv-core__doc-container');
          scrollables.forEach(element => {
            // Disable scrolling behavior
            element.style.overflowY = 'hidden';
            
            // Remove scroll event listeners if possible
            const clone = element.cloneNode(true);
            if (element.parentNode) {
              element.parentNode.replaceChild(clone, element);
            }
          });
        }
      };
      
      // Setup navigation enhancement
      const setupNavigation = () => {
        if (pdfNavigator.current) {
          pdfNavigator.current.setup();
          console.log('PDF navigation enhanced');
        }
      };
      
      // Wait a moment for the PDF to stabilize
      const timer = setTimeout(() => {
        disableScrolling();
        setupNavigation();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, numPages]);

  // Add event listeners for our custom navigation events
  useEffect(() => {
    const handleNextPageEvent = () => {
      if (numPages && currentPage < numPages) {
        setCurrentPage(currentPage + 1);
      }
    };
    
    const handlePrevPageEvent = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };
    
    document.addEventListener('pdf-next-page', handleNextPageEvent);
    document.addEventListener('pdf-previous-page', handlePrevPageEvent);
    
    return () => {
      document.removeEventListener('pdf-next-page', handleNextPageEvent);
      document.removeEventListener('pdf-previous-page', handlePrevPageEvent);
    };
  }, [currentPage, numPages, setCurrentPage]);

  // Create plugins
  const fullScreenPluginInstance = fullScreenPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin({
    enableShortcuts: true,
  });
  const { CurrentPage, NumberOfPages, GoToNextPage, GoToPreviousPage } = pageNavigationPluginInstance;
  
  // Create layout with properly integrated navigation
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    toolbarPlugin: {
      fullScreenPlugin: {
        // We'll handle fullscreen ourselves
        FullScreenButton: () => null,
      },
      pageNavigationPlugin: {
        // Enable all navigation controls
        ShowGoToNextPage: true,
        ShowGoToPreviousPage: true,
        ShowCurrentPageInput: true,
        ShowNumberOfPages: true,
      },
    },
  });

  // Connect navigation plugin functions to our handlers
  useEffect(() => {
    // When the navigation plugin updates, use it to sync our navigation
    if (GoToNextPage && GoToPreviousPage) {
      // Store references to plugin methods for use in event handlers
      window.pdfGoToNextPage = GoToNextPage;
      window.pdfGoToPreviousPage = GoToPreviousPage;
    }
  }, [GoToNextPage, GoToPreviousPage]);

  if (!currentPDF) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <p className="text-center text-gray-500 text-lg">No PDF selected. Please choose a document from the library.</p>
      </div>
    );
  }

  if (!currentPDF.url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <p className="text-center text-gray-500 text-lg">PDF URL is missing. Please select a valid PDF.</p>
      </div>
    );
  }

  if (pdfError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-6">
        <div className="text-center text-red-500 p-4 max-w-md">
          <h3 className="text-xl font-semibold mb-2">Error Loading PDF</h3>
          <p className="mb-4">{pdfError}</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => setPdfError(null)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle page change
  const handlePageChange = (e) => {
    if (e && typeof e.currentPage === 'number') {
      setCurrentPage(e.currentPage);
    }
  };

  // Rotation controls
  const rotateClockwise = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const rotateCounterClockwise = () => {
    setRotation((prevRotation) => (prevRotation - 90 + 360) % 360);
  };

  // Navigation controls - updated for better functionality
  const handleNextPage = () => {
    if (numPages && currentPage < numPages) {
      console.log('Moving to next page:', currentPage + 1);
      
      // First try using our enhanced navigation
      if (pdfNavigator.current && pdfNavigator.current.nextPage()) {
        // Successfully clicked a button, the event listener will update our state
        return;
      }
      
      // If that didn't work, try the plugin's method
      if (window.pdfGoToNextPage) {
        window.pdfGoToNextPage();
        console.log('Used pdfGoToNextPage');
        return;
      }
      
      // Try an alternative method - directly finding and clicking buttons
      const selectors = [
        '[data-testid="page-navigation__next-button"]',
        '.rpv-core__page-navigation-next',
        '[aria-label="Next page"]',
        '.next-button',
        '.rpv-default-layout__toolbar-next-page'
      ];
      
      let buttonClicked = false;
      for (const selector of selectors) {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
          buttons[0].click();
          console.log('Directly clicked next button with selector:', selector);
          buttonClicked = true;
          break;
        }
      }
      
      // Finally, just update our state as a last resort
      if (!buttonClicked) {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      console.log('Moving to previous page:', currentPage - 1);
      
      // First try using our enhanced navigation
      if (pdfNavigator.current && pdfNavigator.current.previousPage()) {
        // Successfully clicked a button, the event listener will update our state
        return;
      }
      
      // If that didn't work, try the plugin's method
      if (window.pdfGoToPreviousPage) {
        window.pdfGoToPreviousPage();
        console.log('Used pdfGoToPreviousPage');
        return;
      }
      
      // Try an alternative method - directly finding and clicking buttons
      const selectors = [
        '[data-testid="page-navigation__previous-button"]',
        '.rpv-core__page-navigation-prev',
        '[aria-label="Previous page"]',
        '.prev-button',
        '.rpv-default-layout__toolbar-previous-page'
      ];
      
      let buttonClicked = false;
      for (const selector of selectors) {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
          buttons[0].click();
          console.log('Directly clicked previous button with selector:', selector);
          buttonClicked = true;
          break;
        }
      }
      
      // Finally, just update our state as a last resort
      if (!buttonClicked) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Handle fullscreen
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

  return (
    <div className="flex flex-col h-full w-full pb-16" ref={containerRef}>
      {/* Document header */}
      <div className="mb-2 sm:mb-4 p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg sm:text-xl font-semibold truncate text-gray-800">{currentPDF.name}</h2>
        
        <div className="flex items-center gap-2">
          {/* Add page navigation buttons to header */}
          <div className="flex items-center mr-3 bg-gray-100 rounded-lg overflow-hidden">
            <button 
              onClick={handlePreviousPage}
              className="px-2 py-1.5 hover:bg-gray-200 transition-colors flex items-center justify-center"
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
              className="px-2 py-1.5 hover:bg-gray-200 transition-colors flex items-center justify-center"
              disabled={numPages && currentPage >= numPages}
              title="Next page"
            >
              <ChevronRight size={18} />
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
            {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-grow flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden relative shadow-inner">
        <div className="w-full h-full" id="pdf-document-container">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <Viewer
              key={currentPDF.url}
              fileUrl={currentPDF.url}
              plugins={[defaultLayoutPluginInstance, fullScreenPluginInstance, pageNavigationPluginInstance]}
              onPageChange={handlePageChange}
              rotation={rotation}
              defaultScale={1}
              renderLoader={(percentages) => (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 border-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading document: {Math.round(percentages)}%</p>
                </div>
              )}
              onDocumentLoad={(e) => {
                if (e && e.doc) {
                  const pages = e.doc.numPages;
                  console.log('Document loaded with', pages, 'pages');
                  setNumPages(pages);
                  setIsLoading(false);
                  
                  // Try to enhance navigation after document is loaded
                  setTimeout(() => {
                    if (pdfNavigator.current) {
                      pdfNavigator.current.setup();
                    }
                  }, 500);
                }
              }}
              onError={(error) => {
                console.error('Error loading PDF:', error);
                setPdfError(error.message || 'Failed to load PDF');
                setIsLoading(false);
              }}
              ref={(viewerInstance) => {
                // Store reference to the viewer instance for direct manipulation
                window.pdfViewer = viewerInstance;
              }}
            />
          </Worker>
          
          {/* Floating navigation controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center bg-white rounded-full shadow-lg px-3 py-2 floating-nav z-20">
            <button 
              onClick={handlePreviousPage}
              className="p-2 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50 toolbar-button transition-colors"
              disabled={currentPage <= 1}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-3 py-1 font-medium">
              {currentPage}{numPages ? ` / ${numPages}` : ''}
            </span>
            <button 
              onClick={handleNextPage}
              className="p-2 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50 toolbar-button transition-colors"
              disabled={numPages && currentPage >= numPages}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation controls */}
      <div className="mt-3 flex justify-center items-center md:hidden">
        <div className="bg-white rounded-lg shadow-md p-1 flex items-center">
          <button 
            onClick={handlePreviousPage}
            className="px-3 py-2 rounded-l-md bg-gray-50 hover:bg-gray-100 flex items-center transition-colors"
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
            className="px-3 py-2 rounded-r-md bg-gray-50 hover:bg-gray-100 flex items-center transition-colors"
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