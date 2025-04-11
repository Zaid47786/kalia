import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import DocumentLibrary from './components/DocumentLibrary';
import PDFReader from './components/PDFReader';
import Sidebar from './components/Sidebar';
import CategoryNavigation from './components/CategoryNavigation';

// Use environment variable if available, or fall back to a default value
// This should be set in your .env or .env.production file
const UPLOAD_AUTH_CODE = process.env.REACT_APP_AUTH_CODE || "ONLYME@DIS";

// Helper function to convert data URI to Blob
const dataURItoBlob = (dataURI) => {
  let byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = decodeURIComponent(dataURI.split(',')[1]);
  }
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], { type: mimeString });
};

const PDFReaderApp = () => {
  // Core states
  const [currentPDF, setCurrentPDF] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('library');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Form states
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    categoryId: '',
    subjectId: '',
    pdf: null
  });
  
  const fileInputRef = useRef(null);

  // Add a new state to store all documents
  const [allDocuments, setAllDocuments] = useState([]);

  // Modify the initial data loading
  useEffect(() => {
    fetchAllDocuments();
    const isAdminUser = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(isAdminUser);
  }, []);

  // Modify fetchAllDocuments to store all documents
  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documents');
      const docs = response.data.documents;
      
      // Store all documents
      setAllDocuments(docs);
      
      // Apply initial filtering
      filterDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Modify filterDocuments to handle null category
  const filterDocuments = (docsToFilter = allDocuments) => {
    let filteredDocs = [...docsToFilter];
    
    // Filter by active category if one is selected
    if (activeCategory && !activeSubject) {
      filteredDocs = filteredDocs.filter(doc => {
        const docCategoryId = parseInt(doc.category_id || doc.categoryId, 10);
        const activeCategoryId = parseInt(activeCategory, 10);
        return docCategoryId === activeCategoryId;
      });
    }
    
    // Filter by active subject if one is selected
    if (activeSubject) {
      filteredDocs = filteredDocs.filter(doc => {
        const docSubjectId = parseInt(doc.subject_id || doc.subjectId, 10);
        const activeSubjectId = parseInt(activeSubject, 10);
        return docSubjectId === activeSubjectId;
      });
    }
    
    setDocuments(filteredDocs);
  };

  // Modify handleSelectCategory to ensure immediate filtering
  const handleSelectCategory = (categoryId, categoryName) => {
    const parsedCategoryId = parseInt(categoryId, 10);
    console.log('Selected category:', categoryName, 'ID:', parsedCategoryId);
    
    // First filter the documents
    const filteredDocs = allDocuments.filter(doc => {
      const docCategoryId = parseInt(doc.category_id || doc.categoryId, 10);
      return docCategoryId === parsedCategoryId;
    });
    
    // Then update the states
    setActiveSubject(null);
    setActiveCategory(parsedCategoryId);
    setDocuments(filteredDocs);
  };

  // Modify handleSelectSubject to work on first click
  const handleSelectSubject = (subjectId, subjectName, categoryId, categoryName) => {
    const parsedSubjectId = parseInt(subjectId, 10);
    const parsedCategoryId = parseInt(categoryId, 10);
    
    console.log('Selected subject:', subjectName, 'ID:', parsedSubjectId, 'Category:', categoryName, 'ID:', parsedCategoryId);
    
    // First filter the documents
    const filteredDocs = allDocuments.filter(doc => {
      const docSubjectId = parseInt(doc.subject_id || doc.subjectId, 10);
      const docCategoryId = parseInt(doc.category_id || doc.categoryId, 10);
      return docSubjectId === parsedSubjectId && docCategoryId === parsedCategoryId;
    });
    
    // Then update the states
    setActiveSubject(parsedSubjectId);
    setActiveCategory(parsedCategoryId);
    setDocuments(filteredDocs);
    setSearchQuery('');
  };

  // Modify clearSubjectFilter to work immediately
  const clearSubjectFilter = () => {
    setActiveSubject(null);
    setActiveCategory(null);
    setDocuments(allDocuments);
  };

  // Authentication Management
  const handleAuthentication = async () => {
    try {
      setLoading(true);
      
      if (authCode === UPLOAD_AUTH_CODE) {
        setIsAdmin(true);
        localStorage.setItem('isAdmin', 'true');
        setShowAuthModal(false);
        setAuthError('');
        setAuthCode('');
        setShowUploadModal(true);
        alert('Authentication successful! You can now upload PDFs.');
        return;
      }
      
      try {
        const response = await axios.post('/api/auth', { authCode });
        if (response.data.success) {
          setIsAdmin(true);
          localStorage.setItem('isAdmin', 'true');
          setShowAuthModal(false);
          setAuthError('');
          setAuthCode('');
          setShowUploadModal(true);
          alert('Authentication successful! You can now upload PDFs.');
        } else {
          setAuthError('Invalid authentication code. Please try again.');
        }
      } catch (error) {
        setAuthError('Invalid authentication code. Please try again.');
      }
    } catch (error) {
      setAuthError('Invalid authentication code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Upload Management
  const handleUploadClick = () => {
    if (isAdmin) {
      setShowUploadModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'categoryId') {
      setUploadFormData(prev => ({
        ...prev,
        [name]: value,
        subjectId: '' // Reset subject when category changes
      }));
    } else if (name === 'subjectId') {
      // Keep subjectId as a string to prevent issues
      setUploadFormData(prev => ({
        ...prev,
        [name]: value // Store the value directly without parsing
      }));
    } else {
    setUploadFormData(prev => ({
      ...prev,
      [name]: value
    }));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFormData(prev => ({
        ...prev,
        pdf: file,
        name: file.name
      }));
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('Only administrators can upload files');
      return;
    }
      
    if (!uploadFormData.pdf) {
      alert('Please select a PDF file');
      return;
    }
      
    if (!uploadFormData.categoryId || !uploadFormData.subjectId) {
      alert('Please select both category and subject');
      return;
    }
      
    if (uploadFormData.pdf.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }
      
    setLoading(true);

    try {
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('pdf', uploadFormData.pdf);
      formData.append('name', uploadFormData.name);
      
      // Ensure categoryId is sent as a number
      const categoryId = parseInt(uploadFormData.categoryId, 10);
      formData.append('categoryId', categoryId);
      
      // Ensure subjectId is sent as a number
      const subjectId = parseInt(uploadFormData.subjectId, 10);
      formData.append('subjectId', subjectId);
      
      // Enhanced logging for debugging
      console.log('Uploading document with complete data:', {
        name: uploadFormData.name,
        categoryId: categoryId,
        subjectId: subjectId,
        fileType: uploadFormData.pdf.type,
        fileSize: uploadFormData.pdf.size,
        fileName: uploadFormData.pdf.name
      });

      // Log the form data entries to verify
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'pdf' ? 'File object' : pair[1]));
      }
      
      // Use fetch API for the upload
      console.log('Sending upload request to server...');
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Auth-Code': UPLOAD_AUTH_CODE
        },
        body: formData
      });
      
      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed with server error:', errorData);
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const result = await response.json();
      console.log('Upload success - server response:', result);
      
      if (result.success) {
        // Add the new document to the documents list
        setDocuments(prev => [...prev, result.document]);
        
        // Reset form and close modal
        setUploadFormData({
          name: '',
          pdf: null,
          categoryId: '',
          subjectId: ''
        });
        setShowUploadModal(false);
        
        alert('File uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error details:', error);
      alert(error.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = async (doc) => {
    try {
      setLoading(true);
      
      if (!doc || !doc.id) {
        throw new Error('Invalid document data');
      }
      
      console.log('Opening document with ID:', doc.id);
      
      setCurrentPDF({
        ...doc,
        url: `/api/pdf/${doc.id}`
      });
      setActiveTab('reader');
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert(`Failed to load PDF document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Document Management
  const openDocument = async (document) => {
    try {
      setLoading(true);
      let documentToOpen = { ...document };
      
      if (document.id) {
        try {
          const response = await axios.get(`/api/documents/${document.id}`);
          if (response.data.document) {
            documentToOpen = response.data.document;
          }
        } catch (error) {
          console.error('Error fetching document details:', error);
        }
      }
      
      if (document.storedData) {
        if (!document.url || !document.url.startsWith('blob:')) {
            if (documentToOpen.url && documentToOpen.url.startsWith('blob:')) {
              URL.revokeObjectURL(documentToOpen.url);
            }
            const blob = dataURItoBlob(document.storedData);
            documentToOpen.url = URL.createObjectURL(blob);
        }
      } else if (document.file_path) {
        const timestamp = new Date().getTime();
        documentToOpen.url = `/api/pdf/${document.id}?t=${timestamp}`;
      }
      
      setCurrentPage(1);
      setCurrentPDF(null);
      setTimeout(() => {
        setCurrentPDF(documentToOpen);
      }, 100);
      
      setActiveTab('reader');
    } catch (error) {
      console.error('Error opening document:', error);
      alert('Error opening document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId) => {
    if (!isAdmin) {
      alert('Only administrators can delete documents');
      return;
    }
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('Deleting document with ID:', docId);
      
      // First validate that the document exists in our current list
      const docToDelete = documents.find(doc => doc.id === docId);
      if (!docToDelete) {
        throw new Error('Document not found in the current list');
      }
      
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Auth-Code': UPLOAD_AUTH_CODE
        }
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete document';
        try {
          const errorData = await response.json();
          console.error('Delete failed with error:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      // Remove the document from the list
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      
      // If the deleted document is currently open in the reader, close it
      if (currentPDF && currentPDF.id === docId) {
        setCurrentPDF(null);
        setActiveTab('library');
      }
      
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Delete error details:', error);
      alert(`Failed to delete document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // UI Helper Functions
  const toggleFullScreen = () => {
    if (window.pdfReaderRef) {
      window.pdfReaderRef.handleFullScreen();
    }
  };

  const handleDownload = () => {
    if (currentPDF && currentPDF.url) {
      const link = document.createElement('a');
      link.href = currentPDF.url;
      link.download = currentPDF.name || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (currentPDF) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: currentPDF.name,
            text: `Check out this PDF: ${currentPDF.name}`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    alert('You have been logged out. You will need to enter the code again to upload PDFs.');
  };

  // Function specifically for handling delete button clicks
  const handleDeleteButtonClick = (e, docId) => {
    e.stopPropagation(); // Prevent card click
    deleteDocument(docId);
  };

  // Render the application
  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <Header 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        handleUploadClick={handleUploadClick} 
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      {/* Category and Subject Navigation */}
      <div className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={clearSubjectFilter}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !activeCategory && !activeSubject
                    ? 'bg-indigo-600 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Documents
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Categories:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSelectCategory(1, 'CLASS 9')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === 1
                      ? 'bg-indigo-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Class 9
                </button>
                <button
                  onClick={() => handleSelectCategory(2, 'CLASS 10')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === 2
                      ? 'bg-indigo-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Class 10
                </button>
              </div>
            </div>

            {activeCategory && (
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subjects:</span>
                <div className="flex flex-wrap gap-2">
                  {activeCategory === 1 && (
                    <>
                      <button
                        onClick={() => handleSelectSubject(6, 'English', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 6
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => handleSelectSubject(21, 'Hindi', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 21
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Hindi
                      </button>
                      <button
                        onClick={() => handleSelectSubject(8, 'Math', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 8
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Math
                      </button>
                      <button
                        onClick={() => handleSelectSubject(1, 'Biology', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 1
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Biology
                      </button>
                      <button
                        onClick={() => handleSelectSubject(2, 'Chemistry', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 2
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Chemistry
                      </button>
                      <button
                        onClick={() => handleSelectSubject(22, 'Physics', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 22
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Physics
                      </button>
                      <button
                        onClick={() => handleSelectSubject(20, 'History', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 20
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        History
                      </button>
                      <button
                        onClick={() => handleSelectSubject(7, 'Geography', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 7
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Geography
                      </button>
                      <button
                        onClick={() => handleSelectSubject(4, 'Political Science', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 4
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Political Science
                      </button>
                      <button
                        onClick={() => handleSelectSubject(3, 'Economics', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 3
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Economics
                      </button>
                      <button
                        onClick={() => handleSelectSubject(5, 'Urdu', 1, 'CLASS 9')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 5
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Urdu
                      </button>
                    </>
                  )}
                  {activeCategory === 2 && (
                    <>
                      <button
                        onClick={() => handleSelectSubject(9, 'English', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 9
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => handleSelectSubject(10, 'Hindi', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 10
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Hindi
                      </button>
                      <button
                        onClick={() => handleSelectSubject(11, 'Math', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 11
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Math
                      </button>
                      <button
                        onClick={() => handleSelectSubject(12, 'Biology', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 12
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Biology
                      </button>
                      <button
                        onClick={() => handleSelectSubject(13, 'Chemistry', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 13
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Chemistry
                      </button>
                      <button
                        onClick={() => handleSelectSubject(14, 'Physics', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 14
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Physics
                      </button>
                      <button
                        onClick={() => handleSelectSubject(15, 'History', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 15
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        History
                      </button>
                      <button
                        onClick={() => handleSelectSubject(16, 'Geography', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 16
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Geography
                      </button>
                      <button
                        onClick={() => handleSelectSubject(17, 'Economics', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 17
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Economics
                      </button>
                      <button
                        onClick={() => handleSelectSubject(18, 'Political Science', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 18
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Political Science
                      </button>
                      <button
                        onClick={() => handleSelectSubject(19, 'Urdu', 2, 'CLASS 10')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeSubject === 19
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Urdu
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto flex-grow p-3 sm:p-4 md:p-6 max-w-screen-2xl">
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg shadow-xl flex items-center space-x-3 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-600'}`}></div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading...</p>
            </div>
          </div>
        )}
        
        {activeTab === 'library' && (
          <div className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-auto ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-white to-gray-50'}`}>
            {loading ? (
              <div className="flex items-center justify-center h-full p-20">
                <div className="flex flex-col items-center space-y-4">
                  <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-600'}`}></div>
                  <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading documents...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className={`text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${
                    darkMode 
                      ? 'from-indigo-400 to-blue-400' 
                      : 'from-indigo-600 to-blue-600'
                  }`}>
                    {activeSubject ? documents[0]?.subject_name : 
                     activeCategory ? (activeCategory === 1 ? 'CLASS 9' : 'CLASS 10') : 
                     'All Documents'}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 flex items-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {documents.length} document{documents.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`group rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden transform hover:-translate-y-1 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700 hover:border-indigo-500 hover:shadow-indigo-500/20' 
                          : 'bg-white border-gray-200 hover:border-indigo-300'
                      } border`}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      {/* Document Info */}
                      <div className="p-5">
                        <div className="flex items-start mb-4">
                          <div className={`flex-shrink-0 p-3 rounded-lg mr-3 transition-all duration-300 shadow-sm ${
                            darkMode 
                              ? 'bg-gradient-to-br from-indigo-900/50 to-blue-900/50 group-hover:from-indigo-800/50 group-hover:to-blue-800/50' 
                              : 'bg-gradient-to-br from-indigo-100 to-blue-50 group-hover:from-indigo-200 group-hover:to-blue-100'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} transform group-hover:scale-110 transition-transform duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base sm:text-lg font-semibold truncate transition-colors duration-200 ${
                              darkMode 
                                ? 'text-gray-100 group-hover:text-indigo-400' 
                                : 'text-gray-800 group-hover:text-indigo-600'
                            }`}>
                              {doc.name}
                            </h3>
                          </div>
                          
                          {isAdmin && (
                            <button
                              className={`absolute top-3 right-3 p-1.5 rounded-full transition-all duration-200 shadow-sm hover:shadow transform hover:scale-110 z-20 ${
                                darkMode 
                                  ? 'bg-red-900/50 hover:bg-red-800/50 text-red-400 hover:text-red-300' 
                                  : 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800'
                              }`}
                              onClick={(e) => handleDeleteButtonClick(e, doc.id)}
                              aria-label="Delete document"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-2.5 mt-5">
                          <div className={`flex items-center text-xs rounded-lg px-3 py-2.5 border transition-all duration-200 hover:shadow-sm ${
                            darkMode 
                              ? 'text-gray-300 bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                              : 'text-gray-600 bg-gradient-to-r from-indigo-50 to-white border-indigo-100 hover:bg-indigo-50'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="truncate font-medium">{doc.subject_name || 'Unknown Subject'}</span>
                          </div>
                          <div className={`flex items-center text-xs rounded-lg px-3 py-2.5 border transition-all duration-200 hover:shadow-sm ${
                            darkMode 
                              ? 'text-gray-300 bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                              : 'text-gray-600 bg-gradient-to-r from-indigo-50 to-white border-indigo-100 hover:bg-indigo-50'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span className="truncate font-medium">{doc.category_name || 'Unknown Category'}</span>
                          </div>
                          <div className={`flex items-center text-xs rounded-lg px-3 py-2.5 border transition-all duration-200 hover:shadow-sm ${
                            darkMode 
                              ? 'text-gray-300 bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                              : 'text-gray-600 bg-gradient-to-r from-indigo-50 to-white border-indigo-100 hover:bg-indigo-50'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Uploaded {new Date(doc.upload_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${darkMode ? 'from-indigo-400 to-blue-400' : 'from-indigo-500 to-blue-500'} transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300`}></div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'reader' && (
          <div className="flex-1 overflow-hidden">
              <PDFReader 
                currentPDF={currentPDF} 
              onPageChange={(page) => {
                console.log('Page changed to:', page);
              }}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Authentication Required</h2>
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Please enter the authentication code to upload PDFs:</p>
            
            <input
              type="password"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Enter authentication code"
              className={`w-full p-2 rounded mb-4 transition-colors duration-200 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border-gray-300'
              } border`}
            />
            
            {authError && <p className="text-red-500 mb-4">{authError}</p>}
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowAuthModal(false)}
                className={`px-4 py-2 rounded transition-colors duration-200 ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleAuthentication}
                className={`px-4 py-2 rounded transition-colors duration-200 ${
                  darkMode 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                disabled={loading}
              >
                Authenticate
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Upload PDF</h2>
            
            <form onSubmit={handleFileUpload}>
              <div className="mb-4">
                <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Select PDF File</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className={`w-full p-2 rounded transition-colors duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300'
                  } border`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Document Name</label>
                <input
                  type="text"
                  name="name"
                  value={uploadFormData.name}
                  onChange={handleUploadFormChange}
                  placeholder="Enter document name"
                  className={`w-full p-2 rounded transition-colors duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  } border`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                <select
                  name="categoryId"
                  value={uploadFormData.categoryId}
                  onChange={handleUploadFormChange}
                  className={`w-full p-2 rounded transition-colors duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300'
                  } border`}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="1">CLASS 9</option>
                  <option value="2">CLASS 10</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
                <select
                  name="subjectId"
                  value={uploadFormData.subjectId}
                  onChange={handleUploadFormChange}
                  className={`w-full p-2 rounded transition-colors duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300'
                  } border`}
                  required
                  disabled={!uploadFormData.categoryId}
                >
                  <option value="">Select Subject</option>
                  {uploadFormData.categoryId === '1' && (
                    <>
                      <option value="6">English</option>
                      <option value="21">Hindi</option>
                      <option value="8">Math</option>
                      <option value="1">Biology</option>
                      <option value="2">Chemistry</option>
                      <option value="22">Physics</option>
                      <option value="20">History</option>
                      <option value="7">Geography</option>
                      <option value="4">Political Science</option>
                      <option value="3">Economics</option>
                      <option value="5">Urdu</option>
                    </>
                  )}
                  {uploadFormData.categoryId === '2' && (
                    <>
                      <option value="9">English</option>
                      <option value="10">Hindi</option>
                      <option value="11">Math</option>
                      <option value="12">Biology</option>
                      <option value="13">Chemistry</option>
                      <option value="14">Physics</option>
                      <option value="15">History</option>
                      <option value="16">Geography</option>
                      <option value="17">Economics</option>
                      <option value="18">Political Science</option>
                      <option value="19">Urdu</option>
                    </>
                  )}
                </select>
                {uploadFormData.subjectId && (
                  <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Selected Subject: {
                      uploadFormData.categoryId === '1' 
                      ? (uploadFormData.subjectId === '22' ? 'Physics (Class 9)' : 
                         uploadFormData.subjectId === '3' ? 'Economics (Class 9)' : 
                         'Other Subject (Class 9)')
                      : (uploadFormData.subjectId === '14' ? 'Physics (Class 10)' : 
                         uploadFormData.subjectId === '17' ? 'Economics (Class 10)' : 
                         'Other Subject (Class 10)')
                    }
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className={`px-4 py-2 rounded transition-colors duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`px-4 py-2 rounded transition-colors duration-200 ${
                    darkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  disabled={loading}
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFReaderApp;