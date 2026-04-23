require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const csrf = require("csurf");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Core middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
  }),
);

// CSRF — NOT applied globally, used per-route instead
const csrfProtection = csrf({ cookie: false });

// In-memory data
const contacts = [];
const USERS = [
  { username: "alice", password: "1234" },
  { username: "bob",   password: "abcd" },
];

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

// POST /api/login — no CSRF needed (user isn't authenticated yet)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.user = { username: user.username };
  res.json({ message: "Login successful" });
});

// GET /api/csrf-token — hands the frontend a valid token
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// POST /api/contacts — protected by both session AND CSRF
app.post("/api/contacts", csrfProtection, (req, res) => {
  // Guard 1: must be logged in
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized — please log in first" });
  }

  // Guard 2: CSRF already validated by csrfProtection middleware above

  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  const newContact = { id: contacts.length + 1, name, phone };
  contacts.push(newContact);

  res.status(201).json({ message: "Contact added", contact: newContact });
});

// ─────────────────────────────────────────
// ERROR HANDLERS
// ─────────────────────────────────────────

// CSRF error handler — must be after routes
app.use((err, req, res, next) => {
  if (err.code !== "EBADCSRFTOKEN") return next(err);
  res.status(403).json({ message: "Invalid CSRF token" });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

// ─────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);