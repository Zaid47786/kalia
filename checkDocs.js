const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pdfreader.db');

// Query to get all documents with their subjects and categories
db.all(`
  SELECT 
    d.id, d.name, d.subject_id, d.category_id,
    s.name as subject_name, 
    c.name as category_name
  FROM documents d
  LEFT JOIN subjects s ON d.subject_id = s.id
  LEFT JOIN categories c ON d.category_id = c.id
  ORDER BY d.id DESC
`, [], (err, rows) => {
  if (err) {
    console.error('Error querying database:', err);
  } else {
    console.log('Recent documents:');
    console.log(JSON.stringify(rows, null, 2));
  }
  
  // Close the database connection
  db.close();
}); 