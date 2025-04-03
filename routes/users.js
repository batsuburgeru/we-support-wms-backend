const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendEmail } = require("../middleware/email.js");

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Login Users
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await db("users")
      .select("id", "name", "email", "password_hash", "role","acc_status")
      .where("email", email)
      .first();

    if (user.acc_status !== "Verified") {
      return res.status(403).json({ error: "Please verify your email before logging in." });
    }  

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/register",
  authenticateToken,
  authorizePermission("create_users"),
  async (req, res) => {
    const trx = await db.transaction(); 
    try {
      const { name, email, password, role } = req.body;

      const validRoles = [
        "WarehouseMan",
        "Supervisor",
        "PlantOfficer",
        "Guard",
        "Admin",
        "Client",
      ];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role provided" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4(); 

      await trx("users").insert({
        id,  
        name,
        email,
        password_hash: hashedPassword,
        role,
        acc_status: "Unverified",
      });

      // Generate email verification token
      const verificationToken = jwt.sign({ id, email }, SECRET_KEY, { expiresIn: "1d" });
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

      // Send verification email
      await sendEmail(
        email,
        "Verify Your Email",
        `<p>Hello,</p>
         <p>Your verification code is: <strong>${verificationToken}</strong></p>
         <p>Or, click <a href="${verificationLink}">here</a> to verify your email.</p>
         <p>If you did not request this, please ignore this email.</p>`
      );
      

      await trx.commit(); 

      res.status(201).json({
        message: "User registered successfully. Please verify your email.",
        verificationToken,
      });

    } catch (error) {
      await trx.rollback(); 
      res.status(500).json({ error: error.message });
    }
  }
);


app.get("/verify-email", async (req, res) => {
  const trx = await db.transaction(); 
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    console.log("Received Token:", token);

    // Verify the token
    const decoded = jwt.verify(token, SECRET_KEY);

    // Update the user's account status to Verified inside the transaction
    const updated = await trx("users")
      .where("id", decoded.id)
      .update({ acc_status: "Verified" });

    if (!updated) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    await trx.commit();

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    await trx.rollback();
    console.error("Error:", error.message);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});


app.post("/forgot-password", async (req, res) => {
  const trx = await db.transaction();
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await trx("users").where("email", email).first();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a password reset token (JWT)
    const resetToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });

    // Generate a reset link that the user can use
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send reset email
    await sendEmail(
      email,
      "Reset Your Password",
      `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
    );

    await trx.commit();

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ error: error.message });
  }
});

app.post("/reset-password", async (req, res) => {
  const trx = await db.transaction();
  try {
    const { token, newPassword } = req.body;

    // Verify the token to extract the user info
    const decoded = jwt.verify(token, SECRET_KEY);

    // Get the user's data from the database
    const user = await trx("users").where("id", decoded.id).first();  
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await trx("users").where("id", decoded.id).update({ password_hash: hashedPassword });

    // Commit the transaction
    await trx.commit();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    await trx.rollback();  
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

// User Info Display
app.get(
  "/display-user-info",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      const id = req.user.id;

      const userInfo = await db("users")
        .select("id", "name", "email", "role")
        .where("id", "like", id)
        .first();

      res.status(201).json({
        message: `User Information retrieved successfully`,
        userInfo,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get Users
app.get(
  "/users",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      const users = await db("users").select("*");
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update User
app.put(
  "/update-user/:id",
  authenticateToken,
  authorizePermission("update_users"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;

      await db("users")
        .where("id", id)
        .update({ name, email, role });

      res.json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
