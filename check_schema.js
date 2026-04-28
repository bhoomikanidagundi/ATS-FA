import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  const pool = mysql.createPool(process.env.MYSQL_URL);

  try {
    const [jobsCols] = await pool.query("DESCRIBE jobs");
    console.log("JOBS TABLE COLUMNS:");
    console.table(jobsCols);

    const [appCols] = await pool.query("DESCRIBE applications");
    console.log("APPLICATIONS TABLE COLUMNS:");
    console.table(appCols);

    const [interviewCols] = await pool.query("DESCRIBE interviews");
    console.log("INTERVIEWS TABLE COLUMNS:");
    console.table(interviewCols);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchema();
