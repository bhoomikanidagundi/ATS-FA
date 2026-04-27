import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  const pool = mysql.createPool(process.env.MYSQL_URL);
  
  try {
    const [jobsCols] = await pool.query("DESCRIBE jobs");
    console.log("JOBS TABLE COLUMNS:");
    console.table(jobsCols);

    const [resumesCols] = await pool.query("DESCRIBE resumes");
    console.log("RESUMES TABLE COLUMNS:");
    console.table(resumesCols);

    const [analysesCols] = await pool.query("DESCRIBE analyses");
    console.log("ANALYSES TABLE COLUMNS:");
    console.table(analysesCols);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchema();
