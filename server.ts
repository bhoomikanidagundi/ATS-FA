import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import mysql from "mysql2/promise";
import fs from "fs";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

const MYSQL_URL = process.env.MYSQL_URL || "mysql://root:XLLWnJWGtSVtzsIOMondWGmLPIEqOYXX@shuttle.proxy.rlwy.net:23244/railway";

const pool = mysql.createPool({
  uri: MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(express.json());

// Set up Multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// --- Initialize Database ---
const initializeDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'candidate'
      )
    `);

    // Add role column to users if it doesn't exist
    try {
      await pool.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'candidate'");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log("Note: users.role column check:", e.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(255),
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        parsed_skills JSON,
        parsed_education JSON,
        parsed_experience JSON,
        current_location VARCHAR(255),
        notice_period VARCHAR(255),
        total_experience VARCHAR(255),
        current_salary VARCHAR(255),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
    // 2. Add missing columns to resumes if they don't exist
    const resumeColumns = [
      ["file_path", "VARCHAR(255)"],
      ["parsed_skills", "JSON"],
      ["parsed_education", "JSON"],
      ["parsed_experience", "JSON"],
      ["current_location", "VARCHAR(255)"],
      ["notice_period", "VARCHAR(255)"],
      ["total_experience", "VARCHAR(255)"],
      ["current_salary", "VARCHAR(255)"]
    ];

    for (const [colName, colType] of resumeColumns) {
      try {
        await pool.query(`ALTER TABLE resumes ADD COLUMN ${colName} ${colType}`);
      } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.log(`Note: resumes.${colName} column check:`, e.message);
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id VARCHAR(255) PRIMARY KEY,
        resumeId VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL,
        result JSON NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (resumeId) REFERENCES resumes(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS generated_resumes (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        content JSON NOT NULL,
        jobDescription TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(255) PRIMARY KEY,
        recruiterId VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        role VARCHAR(255),
        years_of_exp VARCHAR(255),
        location VARCHAR(255),
        work_mode VARCHAR(255),
        skills JSON,
        salary VARCHAR(255),
        notice_period VARCHAR(255),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recruiterId) REFERENCES users(id)
      )
    `);

    // Migration for jobs table
    const jobColumns = [
      ["role", "VARCHAR(255)"],
      ["years_of_exp", "VARCHAR(255)"],
      ["work_mode", "VARCHAR(255)"],
      ["skills", "JSON"],
      ["salary", "VARCHAR(255)"],
      ["notice_period", "VARCHAR(255)"]
    ];

    for (const [colName, colType] of jobColumns) {
      try {
        await pool.query(`ALTER TABLE jobs ADD COLUMN ${colName} ${colType}`);
      } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.log(`Note: jobs.${colName} column check:`, e.message);
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(255) PRIMARY KEY,
        jobId VARCHAR(255) NOT NULL,
        candidateId VARCHAR(255) NOT NULL,
        resumeId VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        matchScore INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (jobId) REFERENCES jobs(id),
        FOREIGN KEY (candidateId) REFERENCES users(id),
        FOREIGN KEY (resumeId) REFERENCES resumes(id)
      )
    `);

    // Add matchScore column to applications if it doesn't exist
    try {
      await pool.query("ALTER TABLE applications ADD COLUMN matchScore INT DEFAULT 0");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log("Note: applications.matchScore column check:", e.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id VARCHAR(255) PRIMARY KEY,
        applicationId VARCHAR(255) NOT NULL,
        scheduledAt DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (applicationId) REFERENCES applications(id)
      )
    `);

    console.log("MySQL database initialized");
  } catch (err) {
    console.error("Database initialization failed", err);
  }
};
initializeDB();

// --- Auth Routes ---
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, role = "candidate" } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "Missing fields" });

  try {
    const [existing] = await pool.query<any[]>("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    await pool.query(
      "INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)",
      [userId, email, hashedPassword, name, role]
    );

    const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: userId, email, name, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const query = role
      ? "SELECT * FROM users WHERE email = ? AND role = ?"
      : "SELECT * FROM users WHERE email = ?";
    const params = role ? [email, role] : [email];

    const [users] = await pool.query<any[]>(query, params);
    const user = users[0];

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Middleware to verify JWT
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const allowRoles = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ error: "Forbidden: Access denied for your role" });
    }
    next();
  };
};

app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
  try {
    const [users] = await pool.query<any[]>("SELECT id, email, name, role FROM users WHERE id = ?", [req.userId]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Google OAuth ---
app.get("/api/auth/google/url", (req, res) => {
  const incomingRedirectUri = req.query.redirectUri as string || (process.env.APP_URL + "/api/auth/google/callback");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: incomingRedirectUri,
    response_type: "code",
    scope: "email profile",
    prompt: "select_account",
    state: incomingRedirectUri // pass redirectUri in state so callback can use it
  });

  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  try {
    const redirectUri = state as string || (process.env.APP_URL + "/api/auth/google/callback");

    // Exchange token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed: " + JSON.stringify(tokenData));
    }

    // Fetch profile
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();
    if (!userResponse.ok) {
      throw new Error("Userinfo fetch failed");
    }

    const { email, name, id: googleId } = userData;

    // Check if user exists in DB
    const [existing] = await pool.query<any[]>("SELECT id FROM users WHERE email = ?", [email]);
    let userId;
    if (existing.length === 0) {
      userId = Date.now().toString();
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
      await pool.query(
        "INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)",
        [userId, email, hashedPassword, name || "User"]
      );
    } else {
      userId = existing[0].id;
    }

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}', user: { id: '${userId}', email: '${email}', name: '${(name || "User").replace(/'/g, "\\'")}' } }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Google Auth Error", err);
    res.send(`
      <html>
        <body>
          <p>Error logging in with Google. Check server logs.</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `);
  }
});

// --- ATS Engine Details ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- Resume APIs ---

// 1. Upload Resume
app.post("/api/uploadResume", authMiddleware, allowRoles("candidate"), upload.single("resume"), async (req: any, res) => {
  try {
    const userId = req.userId;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No resume file provided" });

    const resumeId = Date.now().toString();
    const uploadedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      "INSERT INTO resumes (id, userId, filename, file_path, uploadedAt) VALUES (?, ?, ?, ?, ?)",
      [resumeId, userId, file.originalname, file.path, uploadedAt]
    );

    res.json({ resume_id: resumeId, filename: file.originalname });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Failed to upload resume" });
  }
});

// 2. Analyze Resume (New Endpoint matching request)
app.post("/api/analyzeResume", authMiddleware, allowRoles("candidate"), async (req: any, res) => {
  const { resume_id, jobDescription = "" } = req.body;

  try {
    const [resumes] = await pool.query<any[]>("SELECT * FROM resumes WHERE id = ? AND userId = ?", [resume_id, req.userId]);
    if (resumes.length === 0) return res.status(404).json({ error: "Resume not found" });

    const resume = resumes[0];
    const fileBuffer = fs.readFileSync(resume.file_path);

    let resumeText = "";
    if (resume.filename.endsWith(".pdf")) {
      try {
        const data = await pdfParse(fileBuffer);
        resumeText = data.text;
      } catch (e) {
        console.error("PDF parse error in analyzeResume:", e);
        resumeText = fileBuffer.toString("utf-8");
      }
    } else {
      resumeText = fileBuffer.toString("utf-8");
    }

    const prompt = `
    You are an expert ATS (Applicant Tracking System).
    Analyze this resume and provide structured JSON data.
    
    Job Description: ${jobDescription}
    Resume Text: ${resumeText.substring(0, 8000)}

    JSON Schema:
    {
      "skills": ["skill1", "skill2"],
      "education": [{"degree": "...", "institution": "...", "year": "..."}],
      "experience": [{"title": "...", "company": "...", "duration": "..."}],
      "analysis": { "score": 85, "summary": "..." }
    }
    `;

    const aiResp1 = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    let resultText = (aiResp1.text || "").replace(/```json\n/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(resultText);

    // Update DB with parsed data
    await pool.query(
      "UPDATE resumes SET parsed_skills = ?, parsed_education = ?, parsed_experience = ? WHERE id = ?",
      [JSON.stringify(result.skills), JSON.stringify(result.education), JSON.stringify(result.experience), resume_id]
    );

    res.json(result);
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze resume" });
  }
});

app.post("/api/analyze", authMiddleware, allowRoles("candidate"), upload.single("resume"), async (req: any, res) => {
  try {
    const userId = req.userId;
    const file = req.file;
    const jobDescription = req.body.jobDescription || "";

    if (!file) return res.status(400).json({ error: "No resume file provided" });

    // Parse PDF
    let resumeText = "";
    const fileBuffer = file.buffer || fs.readFileSync(file.path);

    try {
      console.log(`Starting PDF parse for: ${file.originalname}`);
      if (file.mimetype === "application/pdf") {
        const data = await pdfParse(fileBuffer);
        resumeText = data.text;
        console.log("PDF parse successful, text length:", resumeText.length);
      } else {
        resumeText = fileBuffer.toString("utf-8");
        console.log("Text file read successful, text length:", resumeText.length);
      }
    } catch (parseError: any) {
      console.error("PDF/Text Parse Error:", parseError.message);
      return res.status(400).json({ error: "Failed to read resume content. Please try a different file format." });
    }

    if (!resumeText || resumeText.trim() === "") {
      return res.status(400).json({ error: "Could not extract text from file" });
    }

    const prompt = `
    You are an expert ATS (Applicant Tracking System) and Senior Recruiter.
    Analyze the following resume text. If a job description is provided, score the resume against it.
    Provide a detailed analysis output in valid JSON format ONLY, without markdown wrapping.

    Crucial: 
    1. Compare the skills listed in the resume against the requirements in the job description.
    2. Identify specific missing skills and keywords.
    3. In the "skillGapSuggestions" field, provide actionable tips like "Add skills like React, Node.js to improve match".

    Schema:
    {
      "analysis": {
        "score": <number 0-100>,
        "keywordMatch": <number 0-100>,
        "formattingIssues": ["<issue 1>", "<issue 2>"],
        "sectionCompleteness": ["<missing section>", ...],
        "skillRelevance": <number 0-100>,
        "missingKeywords": ["<keyword 1>", "<keyword 2>"],
        "suggestions": [
          { "section": "<section>", "tip": "<tip>", "example": "<example>" }
        ],
        "bulletRewrites": [
          { "original": "<original>", "rewritten": "<better>" }
        ],
        "skillGapSuggestions": ["Add skills like <skill 1>, <skill 2> to improve match", ...],
        "summary": "<Short executive summary>"
      },
      "structuredData": {
        "skills": ["<skill 1>", "<skill 2>"],
        "education": [{"degree": "<degree>", "institution": "<institution>", "year": "<year>"}],
        "experience": [{"title": "<title>", "company": "<company>", "duration": "<duration>"}],
        "current_location": "<city, state>",
        "notice_period": "<notice period>",
        "total_experience": "<total exp>",
        "current_salary": "<salary>"
      }
    }

    Job Description (if empty, assume general best practices):
    ${jobDescription}

    Resume Text:
    ${resumeText.substring(0, 8000)} // Truncate if extremely long to avoid token limits
    `;

    const aiResp2 = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    let resultText = (aiResp2.text || "").replace(/```json\n/g, "").replace(/```\n?/g, "").trim();

    if (resultText.startsWith("```json")) {
      resultText = resultText.substring(7);
      if (resultText.endsWith("```")) resultText = resultText.substring(0, resultText.length - 3);
    }

    // Attempt parse
    let fullResult;
    try {
      fullResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON", parseError, resultText);
      return res.status(500).json({ error: "Invalid analysis response format. Please try again." });
    }

    const analysisData = fullResult.analysis || fullResult;
    const structuredData = fullResult.structuredData || {};

    // Save to DB
    const resumeId = Date.now().toString();
    const uploadedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      "INSERT INTO resumes (id, userId, filename, file_path, uploadedAt, parsed_skills, parsed_education, parsed_experience, current_location, notice_period, total_experience, current_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        resumeId,
        userId,
        file.originalname,
        file.path,
        uploadedAt,
        JSON.stringify(structuredData.skills || []),
        JSON.stringify(structuredData.education || []),
        JSON.stringify(structuredData.experience || []),
        structuredData.current_location || "",
        structuredData.notice_period || "",
        structuredData.total_experience || "",
        structuredData.current_salary || ""
      ]
    );

    const analysisId = (Date.now() + 1).toString();
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      "INSERT INTO analyses (id, resumeId, userId, result, createdAt) VALUES (?, ?, ?, ?, ?)",
      [analysisId, resumeId, userId, JSON.stringify(analysisData), createdAt]
    );

    const newAnalysisDate = new Date();
    res.json({
      id: analysisId,
      resumeId: resumeId,
      userId,
      result: analysisData,
      createdAt: newAnalysisDate.toISOString()
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze resume" });
  }
});

// --- Resume Builder ---
app.post("/api/resume/build", authMiddleware, allowRoles("candidate"), async (req: any, res) => {
  try {
    const userId = req.userId;
    const { personalData, experienceData, educationData, projectsData, skillsData, jobDescription } = req.body;

    const prompt = `
    You are an expert Resume Writer and ATS Optimization Specialist.
    Your task is to take the user's raw information and a target job description (if provided), and generate a highly polished, professional, and ATS-friendly resume.
    
    Guidelines:
    1. Rewrite bullet points to use strong action verbs and highlight achievements/metrics.
    2. Write a compelling summary matching the user's overall profile to the target job (if any).
    3. Ensure all content is highly professional, concise, and standard for ATS parsing.
    4. Output the exact valid JSON format below with no markdown wrapping.
    
    Target Job Description:
    ${jobDescription || 'N/A'}

    User Profile Data (Raw):
    Personal: ${JSON.stringify(personalData)}
    Experience: ${JSON.stringify(experienceData)}
    Education: ${JSON.stringify(educationData)}
    Projects: ${JSON.stringify(projectsData)}
    Skills: ${JSON.stringify(skillsData)}
    
    JSON Schema to Output:
    {
      "personal": { "name": "string", "email": "string", "phone": "string", "location": "string", "linkedin": "string", "github": "string", "summary": "string" },
      "experience": [ { "company": "string", "title": "string", "date": "string", "location": "string", "bullets": ["string"] } ],
      "education": [ { "school": "string", "degree": "string", "date": "string", "location": "string", "details": "string" } ],
      "projects": [ { "name": "string", "technologies": "string", "date": "string", "bullets": ["string"] } ],
      "skills": { "languages": ["string"], "frameworks": ["string"], "tools": ["string"] }
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    let resultText = response.text || "";
    resultText = resultText.replace(/```json\n/g, "").replace(/```\n?/g, "").trim();

    if (resultText.startsWith("```json")) {
      resultText = resultText.substring(7);
      if (resultText.endsWith("```")) resultText = resultText.substring(0, resultText.length - 3);
    }

    let resumeData;
    try {
      resumeData = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response for Builder", parseError, resultText);
      return res.status(500).json({ error: "Failed to generate structured resume. Try again." });
    }

    const resumeId = Date.now().toString();
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      "INSERT INTO generated_resumes (id, userId, content, jobDescription, createdAt) VALUES (?, ?, ?, ?, ?)",
      [resumeId, userId, JSON.stringify(resumeData), jobDescription || "", createdAt]
    );

    res.json({ id: resumeId, content: resumeData });
  } catch (error) {
    console.error("Resume Build Error:", error);
    res.status(500).json({ error: "Failed to build resume" });
  }
});

app.get("/api/resume/generated/:id", authMiddleware, async (req: any, res) => {
  try {
    const [resumes] = await pool.query<any[]>(
      "SELECT * FROM generated_resumes WHERE id = ? AND userId = ?",
      [req.params.id, req.userId]
    );

    if (resumes.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const r = resumes[0];
    const resumeData = {
      ...r,
      content: typeof r.content === 'string' ? JSON.parse(r.content) : r.content,
    };

    res.json(resumeData);
  } catch (error) {
    console.error("Error fetching generated resume:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get specific analysis by ID
app.get("/api/analysis/:id", authMiddleware, async (req: any, res) => {
  try {
    const [analyses] = await pool.query<any[]>(
      `SELECT a.*, r.filename 
       FROM analyses a 
       JOIN resumes r ON a.resumeId = r.id 
       WHERE a.id = ? AND a.userId = ?`,
      [req.params.id, req.userId]
    );

    if (analyses.length === 0) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const a = analyses[0];
    const analysis = {
      ...a,
      result: typeof a.result === 'string' ? JSON.parse(a.result) : a.result,
      resume: {
        id: a.resumeId,
        filename: a.filename
      }
    };

    res.json(analysis);
  } catch (error) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// --- History Route ---
app.get("/api/history", authMiddleware, async (req: any, res) => {
  try {
    const [analyses] = await pool.query<any[]>(
      `SELECT a.*, r.filename 
       FROM analyses a 
       JOIN resumes r ON a.resumeId = r.id 
       WHERE a.userId = ? 
       ORDER BY a.createdAt DESC`,
      [req.userId]
    );

    // Format for frontend
    const history = analyses.map(a => ({
      ...a,
      result: typeof a.result === 'string' ? JSON.parse(a.result) : a.result,
      resume: {
        id: a.resumeId,
        filename: a.filename
      }
    }));

    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// --- Job Listings ---

// Get all jobs (Public/Candidate)
app.get("/api/jobs", async (req, res) => {
  try {
    const [jobs] = await pool.query<any[]>("SELECT id, recruiterId, title, description, location, createdAt FROM jobs ORDER BY createdAt DESC");
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Unified Applications API (Role-based)
app.get("/api/applications", authMiddleware, async (req: any, res) => {
  try {
    if (req.role === 'recruiter') {
      // Recruiter sees all applications for THEIR jobs
      const [apps] = await pool.query<any[]>(`
        SELECT a.*, u.name as candidateName, u.email as candidateEmail, r.filename as resumeFile, j.title as jobTitle
        FROM applications a
        JOIN users u ON a.candidateId = u.id
        LEFT JOIN resumes r ON a.resumeId = r.id
        JOIN jobs j ON a.jobId = j.id
        WHERE j.recruiterId = ?
        ORDER BY a.createdAt DESC
      `, [req.userId]);
      return res.json(apps);
    } else {
      // Candidate sees THEIR own applications
      const [apps] = await pool.query<any[]>(`
        SELECT a.*, j.title as jobTitle, j.location as jobLocation
        FROM applications a
        JOIN jobs j ON a.jobId = j.id
        WHERE a.candidateId = ?
        ORDER BY a.createdAt DESC
      `, [req.userId]);
      return res.json(apps);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});
// Create a Job
app.post("/api/jobs", authMiddleware, allowRoles("recruiter"), async (req: any, res) => {
  const { title, description, location, role, years_of_exp, work_mode, skills, salary, notice_period } = req.body;
  const jobId = Date.now().toString();
  try {
    await pool.query(
      "INSERT INTO jobs (id, recruiterId, title, description, location, role, years_of_exp, work_mode, skills, salary, notice_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        jobId,
        req.userId,
        title,
        description,
        location || "",
        role || "",
        years_of_exp || "",
        work_mode || "",
        JSON.stringify(skills || []),
        salary || "",
        notice_period || ""
      ]
    );
    res.json({ id: jobId, title, role, skills });
  } catch (error) {
    console.error("Job Creation Error:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// Get Suggested Candidates for a Job based on skills/keywords
app.get("/api/jobs/:id/suggestions", authMiddleware, allowRoles("recruiter"), async (req: any, res) => {
  try {
    const [[job]] = await pool.query<any[]>("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const jobSkills = typeof job.skills === 'string' ? JSON.parse(job.skills) : (job.skills || []);

    // Find resumes that have any of these skills
    // In a real app, this would be a more complex search. For now, we'll use JSON search or simple matching.
    const [candidates] = await pool.query<any[]>(`
      SELECT u.id as userId, u.name, u.email, r.id as resumeId, r.filename, r.parsed_skills
      FROM users u
      JOIN resumes r ON u.id = r.userId
      WHERE u.role = 'candidate'
    `);

    // Simple keyword matching logic
    const suggestions = candidates.map(c => {
      const candidateSkills = typeof c.parsed_skills === 'string' ? JSON.parse(c.parsed_skills) : (c.parsed_skills || []);
      const matching = candidateSkills.filter((s: string) =>
        jobSkills.some((js: string) => s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase()))
      );

      return {
        ...c,
        matchCount: matching.length,
        matchingSkills: matching,
        score: jobSkills.length > 0 ? Math.round((matching.length / jobSkills.length) * 100) : 0
      };
    })
      .filter(c => c.matchCount > 0)
      .sort((a, b) => b.score - a.score);

    res.json(suggestions);
  } catch (error) {
    console.error("Suggestions Error:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Get all applications for a job
app.get("/api/jobs/:jobId/applications", authMiddleware, allowRoles("recruiter"), async (req: any, res) => {
  try {
    const [apps] = await pool.query<any[]>(`
      SELECT a.*, u.name as candidateName, u.email as candidateEmail, r.filename as resumeFile
      FROM applications a
      JOIN users u ON a.candidateId = u.id
      LEFT JOIN resumes r ON a.resumeId = r.id
      WHERE a.jobId = ?
    `, [req.params.jobId]);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// Specific Recruiter Action APIs
app.post("/api/shortlist", authMiddleware, allowRoles("recruiter"), async (req: any, res) => {
  const { applicationId } = req.body;
  try {
    await pool.query("UPDATE applications SET status = 'shortlisted' WHERE id = ?", [applicationId]);
    res.json({ success: true, status: "shortlisted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to shortlist" });
  }
});

app.post("/api/reject", authMiddleware, allowRoles("recruiter"), async (req: any, res) => {
  const { applicationId } = req.body;
  try {
    await pool.query("UPDATE applications SET status = 'rejected' WHERE id = ?", [applicationId]);
    res.json({ success: true, status: "rejected" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject" });
  }
});

app.post("/api/scheduleInterview", authMiddleware, allowRoles("recruiter"), async (req: any, res) => {
  const { applicationId, date } = req.body;
  const interviewId = Date.now().toString();
  try {
    // 1. Create interview record
    await pool.query(
      "INSERT INTO interviews (id, applicationId, scheduledAt) VALUES (?, ?, ?)",
      [interviewId, applicationId, date]
    );
    // 2. Update application status
    await pool.query("UPDATE applications SET status = 'interview' WHERE id = ?", [applicationId]);

    res.json({ id: interviewId, status: "interview", scheduledAt: date });
  } catch (error) {
    res.status(500).json({ error: "Failed to schedule interview" });
  }
});

// Get interviews for the logged-in recruiter
app.get("/api/interviews/me", authMiddleware, allowRoles("recruiter"), async (req: any, res) => {
  try {
    const [interviews] = await pool.query<any[]>(`
      SELECT i.*, u.name as candidateName, j.title as jobTitle
      FROM interviews i
      JOIN applications a ON i.applicationId = a.id
      JOIN jobs j ON a.jobId = j.id
      JOIN users u ON a.candidateId = u.id
      WHERE j.recruiterId = ?
      ORDER BY i.scheduledAt ASC
    `, [req.userId]);
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});


// --- Candidate APIs ---

// Advanced Apply for Job with AI Score
app.post("/api/applyJob", authMiddleware, allowRoles("candidate"), async (req: any, res) => {
  const { jobId, resumeId } = req.body;
  const applicationId = Date.now().toString();

  try {
    // 1. Get Resume and Job details
    const [[resume]] = await pool.query<any[]>("SELECT * FROM resumes WHERE id = ?", [resumeId]);
    const [[job]] = await pool.query<any[]>("SELECT * FROM jobs WHERE id = ?", [jobId]);

    if (!resume || !job) return res.status(404).json({ error: "Resume or Job not found" });

    // 2. Extract Text
    const fileBuffer = fs.readFileSync(resume.file_path);
    let resumeText = "";
    if (resume.filename.toLowerCase().endsWith(".pdf")) {
      try {
        resumeText = (await pdfParse(fileBuffer)).text;
      } catch (e) {
        resumeText = fileBuffer.toString("utf-8");
      }
    } else {
      resumeText = fileBuffer.toString("utf-8");
    }

    // 3. AI Workflow: Extract skills and calculate match score
    const prompt = `
    Compare this resume with the job description.
    1. Extract key skills from the job description.
    2. Analyze the resume for those skills.
    3. Calculate a match score (0-100).
    4. Provide a brief justification.

    Job: ${job.title} - ${job.description}
    Resume: ${resumeText.substring(0, 8000)}

    JSON Output:
    { "score": 85, "matchingSkills": ["..."], "missingSkills": ["..."], "justification": "..." }
    `;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const result = JSON.parse((aiResponse.text || "").replace(/```json\n/g, "").replace(/```\n?/g, "").trim());

    // 4. Save application with score
    await pool.query(
      "INSERT INTO applications (id, jobId, candidateId, resumeId, status, matchScore) VALUES (?, ?, ?, ?, 'applied', ?)",
      [applicationId, jobId, req.userId, resumeId, result.score || 0]
    );

    res.json({
      application_id: applicationId,
      jobTitle: job.title,
      status: "applied",
      matchScore: result.score,
      analysis: result
    });

  } catch (error) {
    console.error("Application Error:", error);
    res.status(500).json({ error: "Failed to process application" });
  }
});

// Apply for a job (Original)
app.post("/api/applications", authMiddleware, allowRoles("candidate"), async (req: any, res) => {
  const { jobId, resumeId } = req.body;
  const applicationId = Date.now().toString();
  try {
    // Check if already applied
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM applications WHERE jobId = ? AND candidateId = ?",
      [jobId, req.userId]
    );
    if (existing.length > 0) return res.status(400).json({ error: "Already applied for this job" });

    await pool.query(
      "INSERT INTO applications (id, jobId, candidateId, resumeId) VALUES (?, ?, ?, ?)",
      [applicationId, jobId, req.userId, resumeId || null]
    );
    res.json({ id: applicationId, jobId, status: "pending" });
  } catch (error) {
    res.status(500).json({ error: "Failed to apply for job" });
  }
});

// View my application status
app.get("/api/applications/me", authMiddleware, allowRoles("candidate"), async (req: any, res) => {
  try {
    const [apps] = await pool.query<any[]>(`
      SELECT a.*, j.title as jobTitle, j.location as jobLocation, j.description as jobDescription
      FROM applications a
      JOIN jobs j ON a.jobId = j.id
      WHERE a.candidateId = ?
      ORDER BY a.createdAt DESC
    `, [req.userId]);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});



async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
