import 'dotenv/config';
import mysql from 'mysql2/promise';

async function testDatabaseConnection() {
  let connection: mysql.Connection | undefined;
  try {
    console.log('Attempting to connect to the MySQL database...');

    // Create the connection to the database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connection created. Pinging the database...');
    
    // Perform a simple query to check the connection
    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    
    console.log('✅ Database connection successful!');
    console.log('Query result:', (rows as any)[0].solution);

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed.');
    }
  }
}

testDatabaseConnection();
