const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pdfreader.db');

// Query to get all subjects with their categories
db.all(`
  SELECT s.id, s.name as subject_name, s.category_id, c.name as category_name
  FROM subjects s
  JOIN categories c ON s.category_id = c.id
  ORDER BY s.category_id, s.id
`, [], (err, rows) => {
  if (err) {
    console.error('Error querying database:', err);
  } else {
    console.log('All subjects:');
    console.log(JSON.stringify(rows, null, 2));
  }
  
  // Query to get Physics subjects specifically
  db.all(`
    SELECT s.id, s.name as subject_name, s.category_id, c.name as category_name
    FROM subjects s
    JOIN categories c ON s.category_id = c.id
    WHERE s.name = 'Physics'
    ORDER BY s.category_id
  `, [], (err, physicsRows) => {
    if (err) {
      console.error('Error querying Physics subjects:', err);
    } else {
      console.log('\nPhysics subjects:');
      console.log(JSON.stringify(physicsRows, null, 2));
    }
    
    // Close the database connection
    db.close();
  });
}); 