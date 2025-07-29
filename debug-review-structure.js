// Debug the actual review structure in the database
console.log('Debugging review structure...');

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

// Check the actual review structure
fetch(`${supabaseUrl}/rest/v1/reviews?select=*&limit=1`, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Review structure check:', data);
  
  if (Array.isArray(data) && data.length > 0) {
    console.log('Sample review fields:', Object.keys(data[0]));
    console.log('Full review data:', data[0]);
  } else if (data.code) {
    console.error('Error:', data.message);
    console.error('Details:', data.details);
  } else {
    console.log('No reviews found in database');
  }
})
.catch(error => {
  console.error('Network error:', error);
});

// Also check the table schema
fetch(`${supabaseUrl}/rest/v1/rpc/get_table_schema`, {
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ table_name: 'reviews' })
})
.then(response => response.json())
.then(data => {
  console.log('Table schema:', data);
})
.catch(error => {
  console.log('Schema check failed (expected):', error.message);
});
