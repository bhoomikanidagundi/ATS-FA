import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { exec } from 'child_process';

dotenv.config();

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', timestamp);

  console.log(`Starting backup to: ${backupDir}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
  });

  try {
    // 1. Backup Database Tables
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    for (const tableName of tableNames) {
      console.log(`  Backing up table: ${tableName}`);
      const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
      fs.writeFileSync(
        path.join(backupDir, `${tableName}.json`),
        JSON.stringify(rows, null, 2)
      );
    }

    // 2. Backup Uploads folder (Resumes)
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      console.log('  Zipping uploads folder...');
      // Using PowerShell's Compress-Archive since we are on Windows
      const zipPath = path.join(backupDir, 'uploads.zip');
      const command = `powershell -Command "Compress-Archive -Path '${uploadsDir}' -DestinationPath '${zipPath}' -Force"`;
      
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('  Error zipping uploads:', stderr);
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });
    }

    console.log('Backup completed successfully!');
  } catch (err) {
    console.error('Backup failed:', err);
  } finally {
    await pool.end();
  }
}

runBackup();
