import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const MYSQL_URL = process.env.MYSQL_URL || "mysql://root:XLLWnJWGtSVtzsIOMondWGmLPIEqOYXX@shuttle.proxy.rlwy.net:23244/railway";

async function testConnection() {
  try {
    const connection = await mysql.createConnection(MYSQL_URL);
    console.log("Successfully connected to the database!");
    const [rows] = await connection.execute("SELECT 1 as result");
    console.log("Query test:", rows);
    await connection.end();
  } catch (err) {
    console.error("Failed to connect to the database:", err.message);
  }
}

testConnection();
