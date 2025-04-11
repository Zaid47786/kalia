const express = require('express');
const multer = require('multer');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Create Express app
const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: isProduction ? process.env.FRONTEND_URL || 'https://your-netlify-app.netlify.app' : 'http://localhost:4003',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Auth-Code']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the React app in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'build')));
  console.log('Serving static files from build directory');
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use absolute path for uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp and sanitized original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('./pdfreader.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0
    )`);
    
    // Create categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT
    )`);
    
    // Create subjects table
    db.run(`CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      description TEXT,
      icon TEXT,
      color TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      UNIQUE(name, category_id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      pages INTEGER,
      owner_id INTEGER,
      upload_date TEXT,
      is_public INTEGER DEFAULT 1,
      category_id INTEGER,
      subject_id INTEGER,
      FOREIGN KEY (owner_id) REFERENCES users (id),
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (subject_id) REFERENCES subjects (id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER,
      page INTEGER,
      type TEXT,
      content TEXT,
      position_x REAL,
      position_y REAL,
      created_at TEXT,
      user_id INTEGER,
      FOREIGN KEY (document_id) REFERENCES documents (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // Insert default admin user if not exists
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
      if (err) {
        console.error(err.message);
      }
      if (!row) {
        const validAuthCode = process.env.REACT_APP_AUTH_CODE || 'ONLYME@DIS';
        db.run("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)", 
          ['admin', validAuthCode, 1], 
          function(err) {
            if (err) {
              console.error(err.message);
            } else {
              console.log('Default admin user created');
            }
          }
        );
      }
    });
    
    // Insert default categories if they don't exist
    db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
      if (err) {
        console.error(err.message);
      } else if (row.count === 0) {
        // Insert Class 9 and Class 10 categories
        const categories = [
          { name: 'CLASS 9', description: 'Class 9 study materials', icon: 'book-open', color: '#4F46E5' },
          { name: 'CLASS 10', description: 'Class 10 study materials', icon: 'graduation-cap', color: '#7C3AED' }
        ];
        
        // Define subjects for both categories
        const subjects = [
          { name: 'English', icon: 'book', color: '#3B82F6' },
          { name: 'Hindi', icon: 'book', color: '#EF4444' },
          { name: 'Math', icon: 'calculator', color: '#10B981' },
          { name: 'Biology', icon: 'flask', color: '#84CC16' },
          { name: 'Chemistry', icon: 'flask-conical', color: '#F59E0B' },
          { name: 'Physics', icon: 'atom', color: '#6366F1' },
          { name: 'History', icon: 'landmark', color: '#8B5CF6' },
          { name: 'Geography', icon: 'globe', color: '#EC4899' },
          { name: 'Economics', icon: 'bar-chart', color: '#14B8A6' },
          { name: 'Politics', icon: 'building-columns', color: '#F97316' },
          { name: 'Urdu', icon: 'book', color: '#8B5CF6' }
        ];
        
        // Insert categories one by one
        let categoryIndex = 0;
        
        const insertCategory = () => {
          const category = categories[categoryIndex];
          
          db.run("INSERT INTO categories (name, description, icon, color) VALUES (?, ?, ?, ?)",
            [category.name, category.description, category.icon, category.color],
            function(err) {
              if (err) {
                console.error('Error creating category:', err.message);
              } else {
                const categoryId = this.lastID;
                console.log(`Category ${category.name} created with ID ${categoryId}`);
                
                // Insert subjects for this category
                let subjectIndex = 0;
                
                const insertSubject = () => {
                  if (subjectIndex < subjects.length) {
                    const subject = subjects[subjectIndex];
                    
                    db.run("INSERT INTO subjects (name, category_id, icon, color) VALUES (?, ?, ?, ?)",
                      [subject.name, categoryId, subject.icon, subject.color],
                      function(err) {
                        if (err) {
                          console.error('Error creating subject:', err.message);
                        } else {
                          console.log(`Subject ${subject.name} created for category ${category.name} with ID ${this.lastID}`);
                        }
                        
                        subjectIndex++;
                        insertSubject(); // Insert next subject
                      }
                    );
                  } else {
                    // All subjects inserted for this category, move to next category
                    categoryIndex++;
                    if (categoryIndex < categories.length) {
                      insertCategory(); // Insert next category
                    }
                  }
                };
                
                // Start inserting subjects
                insertSubject();
              }
            }
          );
        };
        
        // Start inserting categories
        insertCategory();
      }
    });
  }
});

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authCode = req.headers['auth-code'];
  const validAuthCode = process.env.REACT_APP_AUTH_CODE || 'ONLYME@DIS';
  
  if (authCode === validAuthCode) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }
};

// API Routes

// Authenticate user
app.post('/api/auth', (req, res) => {
  const { authCode } = req.body;
  const validAuthCode = process.env.REACT_APP_AUTH_CODE || 'ONLYME@DIS';
  
  if (authCode === validAuthCode) {
    res.json({ success: true, isAdmin: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid authentication code' });
  }
});

// Get all documents with subject and category information
app.get('/api/documents', (req, res) => {
  console.log('Fetching all documents');
  db.all(`
    SELECT d.*, s.name as subject_name, c.name as category_name 
    FROM documents d 
    LEFT JOIN subjects s ON d.subject_id = s.id 
    LEFT JOIN categories c ON d.category_id = c.id 
    ORDER BY d.upload_date DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching documents:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Error fetching documents' 
      });
    }
    
    console.log('Found documents:', rows.length);
    console.log('Sample document:', rows[0]);
    
    const documents = rows.map(row => ({
      id: row.id,
      name: row.name,
      file_path: row.file_path,
      pages: row.pages,
      owner_id: row.owner_id,
      upload_date: row.upload_date,
      is_public: row.is_public,
      category_id: row.category_id,
      subject_id: row.subject_id,
      subject_name: row.subject_name,
      category_name: row.category_name
    }));
    
    res.json({ 
      success: true,
      documents 
    });
  });
});

// Get documents by subject ID
app.get('/api/subjects/:subjectId/documents', (req, res) => {
  const subjectId = parseInt(req.params.subjectId, 10);
  
  if (isNaN(subjectId)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid subject ID' 
    });
  }
  
  db.all(`
    SELECT d.*, s.name as subject_name, c.name as category_name 
    FROM documents d 
    LEFT JOIN subjects s ON d.subject_id = s.id 
    LEFT JOIN categories c ON d.category_id = c.id 
    WHERE d.subject_id = ? 
    ORDER BY d.upload_date DESC
  `, [subjectId], (err, rows) => {
    if (err) {
      console.error('Error fetching documents for subject:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Error fetching documents for subject' 
      });
    }
    
    const documents = rows.map(row => ({
      id: row.id,
      name: row.name,
      file_path: row.file_path,
      pages: row.pages,
      owner_id: row.owner_id,
      upload_date: row.upload_date,
      is_public: row.is_public,
      category_id: row.category_id,
      subject_id: row.subject_id,
      subject_name: row.subject_name,
      category_name: row.category_name
    }));
    
    res.json({ 
      success: true,
      documents 
    });
  });
});

// Upload a new document
app.post('/api/documents', authenticateAdmin, upload.single('pdf'), (req, res) => {
  try {
    const { name, categoryId, subjectId } = req.body;
    const file = req.file;
    
    console.log('Upload request received:', { name, categoryId, subjectId });
    
    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'No PDF file uploaded' 
      });
    }
    
    // Validate category and subject IDs
    if (!categoryId || !subjectId) {
      // Clean up the uploaded file if validation fails
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(400).json({ 
        success: false,
        error: 'Category and subject IDs are required' 
      });
    }
    
    // Convert IDs to integers
    const parsedCategoryId = parseInt(categoryId, 10);
    const parsedSubjectId = parseInt(subjectId, 10);
    
    console.log('Parsed IDs:', { parsedCategoryId, parsedSubjectId });
    
    if (isNaN(parsedCategoryId) || isNaN(parsedSubjectId)) {
      // Clean up the uploaded file if validation fails
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(400).json({ 
        success: false,
        error: 'Invalid category or subject ID' 
      });
    }
    
    // Verify that the subject exists and belongs to the selected category
    db.get('SELECT id, name, category_id FROM subjects WHERE id = ?', [parsedSubjectId], (err, subject) => {
      if (err) {
        console.error('Database error when finding subject:', err);
        // Clean up the uploaded file if database error occurs
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
        return res.status(500).json({ 
          success: false,
          error: 'Database error while validating subject' 
        });
      }
      
      if (!subject) {
        // Clean up the uploaded file if subject not found
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
        return res.status(400).json({ 
          success: false,
          error: 'Subject not found' 
        });
      }
      
      if (subject.category_id !== parsedCategoryId) {
        // Clean up the uploaded file if subject doesn't belong to category
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
        return res.status(400).json({ 
          success: false,
          error: 'Subject does not belong to the selected category' 
        });
      }
      
      // Get admin user ID
      db.get("SELECT id FROM users WHERE username = 'admin'", [], (err, row) => {
        if (err) {
          // Clean up the uploaded file if database error occurs
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
          });
          return res.status(500).json({ 
            success: false,
            error: 'Database error while finding admin user' 
          });
        }
        
        const ownerId = row ? row.id : 1;
        const uploadDate = new Date().toISOString().split('T')[0];
        
        // Store relative path in database
        const relativePath = path.relative(__dirname, file.path);
        
        // Log the values being inserted
        console.log('Inserting document with values:', {
          name,
          filePath: relativePath,
          ownerId,
          uploadDate,
          categoryId: parsedCategoryId,
          subjectId: parsedSubjectId,
          subjectName: subject.name
        });
        
        // Insert the document into the database
        db.run(
          'INSERT INTO documents (name, file_path, owner_id, upload_date, category_id, subject_id) VALUES (?, ?, ?, ?, ?, ?)',
          [name, relativePath, ownerId, uploadDate, parsedCategoryId, parsedSubjectId],
          function(err) {
            if (err) {
              console.error('Error inserting document:', err);
              // Clean up the uploaded file if database error occurs
              fs.unlink(file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting file:', unlinkErr);
              });
              return res.status(500).json({ 
                success: false,
                error: 'Database error while saving document' 
              });
            }
            
            // Return success response with the new document
            res.json({
              success: true,
              document: {
                id: this.lastID,
                name,
                file_path: relativePath,
                upload_date: uploadDate,
                category_id: parsedCategoryId,
                subject_id: parsedSubjectId
              }
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    // Clean up the uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'An unexpected error occurred during upload' 
    });
  }
});

// Get a specific document
app.get('/api/documents/:id', (req, res) => {
  const id = req.params.id;
  
  db.get(`SELECT documents.*, 
          users.username as owner_name,
          categories.name as category_name,
          subjects.name as subject_name
          FROM documents 
          LEFT JOIN users ON documents.owner_id = users.id
          LEFT JOIN categories ON documents.category_id = categories.id
          LEFT JOIN subjects ON documents.subject_id = subjects.id
          WHERE documents.id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    res.json({ document: row });
  });
});

// Serve PDF files
app.get('/api/pdf/:id', (req, res) => {
  const id = req.params.id;
  
  db.get('SELECT file_path FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching document:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    // Construct absolute path
    const filePath = path.join(__dirname, row.file_path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }
    
    // Set proper headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    
    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
    });
  });
});

// Delete a document
app.delete('/api/documents/:id', async (req, res) => {
  const authCode = req.headers['auth-code'];
  const validAuthCode = process.env.REACT_APP_AUTH_CODE || 'ONLYME@DIS';
  
  if (!authCode || authCode !== validAuthCode) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const documentId = req.params.id;
  if (!documentId) {
    return res.status(400).json({ error: 'Document ID is required' });
  }

  try {
    // First get the file path using regular callback pattern
    db.get('SELECT file_path FROM documents WHERE id = ?', [documentId], (err, document) => {
      if (err) {
        console.error('Error finding document:', err);
        return res.status(500).json({ error: 'Database error when finding document' });
      }
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      const filePath = document.file_path;
      console.log('Found document with file path:', filePath);
      
      // Delete from database
      db.run('DELETE FROM documents WHERE id = ?', [documentId], function(err) {
        if (err) {
          console.error('Error deleting document from database:', err);
          return res.status(500).json({ error: 'Failed to delete document from database' });
        }
        
        console.log('Document deleted from database successfully');
        
        // Delete file from filesystem
        fs.unlink(path.join(__dirname, filePath), (err) => {
          if (err) {
            console.error('Error deleting file:', err);
            // Still return success as the database record is deleted
          } else {
            console.log('File deleted successfully from filesystem');
          }
          
          // Return success response
          res.json({ message: 'Document deleted successfully' });
        });
      });
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Add an annotation
app.post('/api/annotations', (req, res) => {
  const { document_id, page, type, content, position_x, position_y, user_id } = req.body;
  const created_at = new Date().toISOString();
  
  db.run(`INSERT INTO annotations (document_id, page, type, content, position_x, position_y, created_at, user_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [document_id, page, type, content, position_x, position_y, created_at, user_id || null], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ 
        success: true, 
        annotation: {
          id: this.lastID,
          document_id,
          page,
          type,
          content,
          position_x,
          position_y,
          created_at,
          user_id
        }
      });
    }
  );
});

// Get annotations for a document
app.get('/api/annotations/:documentId', (req, res) => {
  const documentId = req.params.documentId;
  
  db.all('SELECT * FROM annotations WHERE document_id = ?', [documentId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ annotations: rows });
  });
});

// Add new API endpoints for categories and subjects

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ categories: rows });
  });
});

// Get subjects for a category
app.get('/api/categories/:categoryId/subjects', (req, res) => {
  const categoryId = req.params.categoryId;
  
  db.all('SELECT * FROM subjects WHERE category_id = ?', [categoryId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ subjects: rows });
  });
});

// Get documents for a subject
app.get('/api/subjects/:subjectId/documents', (req, res) => {
  const subjectId = parseInt(req.params.subjectId, 10);
  
  if (isNaN(subjectId)) {
    return res.status(400).json({ error: 'Invalid subject ID' });
  }
  
  console.log('Fetching documents for subject ID:', subjectId);
  
  // First, get the actual subject ID from the database
  db.get('SELECT id, category_id FROM subjects WHERE id = ?', [subjectId], (err, subject) => {
    if (err) {
      console.error('Error finding subject:', err.message);
      return res.status(500).json({ error: 'Database error when finding subject' });
    }
    
    if (!subject) {
      console.error('Subject not found with ID:', subjectId);
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    console.log('Found subject:', subject);
    
    // Now get documents for this subject
    db.all(`SELECT documents.*, 
            users.username as owner_name,
            categories.name as category_name,
            subjects.name as subject_name
            FROM documents 
            LEFT JOIN users ON documents.owner_id = users.id
            LEFT JOIN categories ON documents.category_id = categories.id
            LEFT JOIN subjects ON documents.subject_id = subjects.id
            WHERE documents.subject_id = ? AND documents.is_public = 1`, 
      [subject.id], (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        console.log('Found documents:', rows.length);
        res.json({ documents: rows });
      }
    );
  });
});

// Serve React app for any other routes in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
  console.log('Serving React app for all other routes');
}

// Start the server
app.listen(port, () => {
  console.log(`Server running in ${isProduction ? 'production' : 'development'} mode on port ${port}`);
}); 
