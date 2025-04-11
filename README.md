# BookVault Pro - PDF Reader with SQL Database

A full-featured PDF reader application with annotation capabilities, built with React and backed by an SQLite database for permanent storage.

## Features

- **PDF Viewing**: View PDFs with zoom, rotation, and navigation controls
- **Document Library**: Browse, search, and manage your PDF collection
- **Annotations**: Add highlights, underlines, and text notes to PDFs
- **Authentication**: Only authorized users (with the code "ONLYME@DIS") can upload PDFs
- **Permanent Storage**: All PDFs are stored in an SQLite database for persistence
- **Dark Mode**: Toggle between light and dark themes

## Technology Stack

- **Frontend**: React, Tailwind CSS, PDF.js
- **Backend**: Express.js, SQLite
- **File Storage**: PDFs are stored on the server's filesystem
- **Authentication**: Simple code-based authentication

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd pdf-reader-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

   This will start both the backend server (on port 5000) and the React development server (on port 3000).

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Authentication

- To upload PDFs, you need to authenticate with the code: `ONLYME@DIS`
- Click the "Upload PDF" button and enter the code when prompted
- Once authenticated, you can upload PDFs and they will be available to all users

## Database Structure

The application uses SQLite with the following tables:

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0
)
```

### Documents Table
```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  pages INTEGER,
  owner_id INTEGER,
  upload_date TEXT,
  is_public INTEGER DEFAULT 1,
  FOREIGN KEY (owner_id) REFERENCES users (id)
)
```

### Annotations Table
```sql
CREATE TABLE annotations (
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
)
```

## File Storage

- Uploaded PDFs are stored in the `uploads` directory on the server
- The database stores the file path, not the actual PDF content
- This approach allows for efficient storage of large PDF files

## API Endpoints

### Authentication
- `POST /api/auth` - Authenticate with the special code

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Upload a new document (requires authentication)
- `GET /api/documents/:id` - Get a specific document
- `DELETE /api/documents/:id` - Delete a document (requires authentication)
- `GET /api/pdf/:id` - Serve a PDF file

### Annotations
- `POST /api/annotations` - Add an annotation
- `GET /api/annotations/:documentId` - Get annotations for a document

## Production Deployment

For production deployment:

1. Build the React application:
   ```
   npm run build
   ```

2. Set up a production-ready database (consider using PostgreSQL or MySQL)

3. Configure environment variables for production settings

4. Deploy to your preferred hosting service

## License

[MIT License](LICENSE)

## Acknowledgements

- [React PDF Viewer](https://react-pdf-viewer.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)
- [SQLite](https://www.sqlite.org/) 