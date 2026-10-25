import dotenv from 'dotenv';
import { app } from './app.js';
import { pool } from './config/db.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

try {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  console.log(`Connected to MySQL database "${process.env.DB_NAME || 'gym_management'}".`);
} catch (err) {
  console.error('Failed to connect to MySQL.');
  console.error(err.message);
  console.error('Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME in backend/.env');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Gym Management API listening on http://localhost:${PORT}`);
});
