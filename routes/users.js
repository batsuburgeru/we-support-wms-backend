const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const uploadImage = require("../middleware/uploadImage"); 
const fs = require("fs");
const path = require("path");
const { sendEmail } = require("../middleware/email.js"); 
const DEFAULT_IMAGE = "/assets/profilePictures/default.jpg";

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

    // Check if user exists and fetch acc_status
    const user = await db("users")
      .select("id", "name", "email", "password_hash", "role", "acc_status")
      .where("email", email)
      .first();

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if the account is verified
    if (user.acc_status !== "Verified") {
      return res
        .status(403)
        .json({
          error:
            "Account not verified. Please verify your email before logging in.",
        });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET_KEY
    );

    // Set token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevents JavaScript access (More Secure)
      secure: process.env.NODE_ENV === "production", // Enables Secure flag in production (HTTPS required)
      sameSite: "Strict", // Prevents CSRF attacks
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout Users
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.json({ message: "Logged out successfully" });
});

app.post(
  "/register",

  /* async (req, res, next) => {
    const { role } = req.body;

    if (role === "Client") {
      // Client self-registration — no auth needed
      return next();
    }

    // Other roles need authentication + permission
    authenticateToken(req, res, async () => {
      authorizePermission("create_users")(req, res, next);
    });
  }, */

  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { name, email, password, role, org_name, comp_add, contact_num } =
        req.body;
      const id = uuidv4();

      const validRoles = [
        "WarehouseMan",
        "Supervisor",
        "PlantOfficer",
        "Guard",
        "Admin",
        "Client",
      ];
      console.log(role);
      console.log(req.body);
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role provided" });
      }

      const existingUser = await trx("users").where({ email }).first();
      if (existingUser) {
        throw new Error("Email already exists"); // Trigger rollback
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Use `trx` for database operations
      await trx("users").insert({
        id: id, // Generate a new UUID for the user
        name,
        email,
        password_hash: hashedPassword,
        role
      });

      let client = null;
      if (role === "Client") {
        await trx("clients").insert({
          client_id: id,
          org_name,
          comp_add,
          contact_num,
        });
        client = await trx("clients").where({ client_id: id }).first();
      }

      // ✅ Use `trx` to fetch the user within the same transaction
      const user = await trx("users").where({ id }).first();

      // Send email verification
      const verificationToken = jwt.sign({ id, email }, SECRET_KEY, {
        expiresIn: "1h",
      });
      const verifyLink = `${process.env.BACKEND_URL}/users/verify-email?token=${verificationToken}`;
      await sendEmail(
        email,
        "Verify Your Email",
        `<p>Hello ${name},</p>
   <p>Please verify your email by clicking this <a href="${verifyLink}">link</a>.</p>
   <p>This link expires in 1 hour.</p>`
      );

      await trx.commit(); // Commit transaction

      if (role === "Client") {
        res
          .status(201)
          .json({ message: "User Created successfully", user, client });
      } else {
        res.status(201).json({ message: "User Created successfully", user });
      }
    } catch (error) {
      await trx.rollback(); // Rollback transaction if any error occurs
      res.status(500).json({ error: error.message });
    }
  }
);

app.get("/verify-email", async (req, res) => {
  const trx = await db.transaction();
  try {
    const token = req.query.token;
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/email-verified?status=error&message=Missing token`);
    }

    console.log("Received Token:", token);

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (error) {
      const msg = error.name === 'TokenExpiredError' ? "Token expired" : "Invalid token";
      return res.redirect(`${process.env.FRONTEND_URL}/email-verified?status=error&message=${encodeURIComponent(msg)}`);
    }

    // Update user
    const updated = await trx("users")
      .where("id", decoded.id)
      .update({ acc_status: "Verified" });

    if (!updated) {
      return res.redirect(`${process.env.FRONTEND_URL}/email-verified?status=error&message=Invalid or expired token`);
    }

    await trx.commit();

    return res.redirect(`${process.env.FRONTEND_URL}/email-verified?status=success&message=${encodeURIComponent("Email verified successfully")}`);
  } catch (error) {
    await trx.rollback();
    console.error("Error:", error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/email-verified?status=error&message=${encodeURIComponent("Something went wrong")}`);
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
    const resetToken = jwt.sign({ id: user.id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    // Generate a reset link that the user can use
    const resetLink = `${process.env.BACKEND_URL}/users/reset-password?token=${resetToken}`;

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

app.put("/reset-password", async (req, res) => {
  const trx = await db.transaction();
  try {
    // Extract token from query params
    const token = req.query.token;
    const { newPassword } = req.body;

    // Check if token is provided
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/password-reset?status=error&message=${encodeURIComponent("Token is required")}`);
    }

    // Verify the token to extract user info
    const decoded = jwt.verify(token, SECRET_KEY);

    // Get the user's data from the database
    const user = await trx("users").where("id", decoded.id).first();
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/password-reset?status=error&message=${encodeURIComponent("User not found")}`);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await trx("users")
      .where("id", decoded.id)
      .update({ password_hash: hashedPassword });

    // Commit the transaction
    await trx.commit();

    // Redirect to the frontend with success message
    return res.redirect(`${process.env.FRONTEND_URL}/password-reset?status=success&message=${encodeURIComponent("Password reset successfully")}`);
  } catch (error) {
    await trx.rollback();
    console.error("Error:", error);
    // Redirect to the frontend with error message
    return res.redirect(`${process.env.FRONTEND_URL}/password-reset?status=error&message=${encodeURIComponent("Invalid or expired token")}`);
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

      // Fetch user data with client-specific info if role is 'Client'
      const userInfo = await db("users")
        .leftJoin("clients", "users.id", "clients.client_id") // Left join with clients table
        .select(
          "users.id",
          "users.name",
          "users.email",
          "users.role",
          "clients.org_name",     // Client-specific data
          "clients.comp_add",     // Client-specific data
          "clients.contact_num"   // Client-specific data
        )
        .where("users.id", "like", id)
        .first();

      if (!userInfo) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        message: `User Information retrieved successfully`,
        userInfo,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// Filter Users using Role
app.get(
  "/filter-users",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      const { search } = req.query;

      // Join users with clients table for 'Client' role
      const users = await db("users")
        .leftJoin("clients", "users.id", "clients.client_id") // Left join with clients table
        .select("users.*", "clients.org_name", "clients.comp_add", "clients.contact_num") // Select user and client data
        .where("users.role", "like", `%${search}%`);

      if (!users || users.length === 0) {
        return res.status(200).json({
          message: "No matching User found.",
        });
      }

      // Organize the response to differentiate client data
      const usersWithClientData = users.map(user => {
        if (user.role === 'Client') {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            org_name: user.org_name, // Client-specific data
            comp_add: user.comp_add, // Client-specific data
            contact_num: user.contact_num, // Client-specific data
            img_url: user.img_url, // Include profile image if available
          };
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          img_url: user.img_url, // Include profile image if available
        };
      });

      res.status(200).json({
        message: `Users filtered successfully`,
        users: usersWithClientData,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Users
app.get(
  "/search-users",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      const { search } = req.query;

      // Join users with clients table for 'Client' role
      const users = await db("users")
        .leftJoin("clients", "users.id", "clients.client_id") // Left join with clients table
        .select("users.*", "clients.org_name", "clients.comp_add", "clients.contact_num") // Select user and client data
        .where("users.id", "like", `%${search}%`);

      if (!users || users.length === 0) {
        return res.status(200).json({
          message: "No matching User found.",
        });
      }

      // Organize the response to differentiate client data
      const usersWithClientData = users.map(user => {
        if (user.role === 'Client') {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            org_name: user.org_name, // Client-specific data
            comp_add: user.comp_add, // Client-specific data
            contact_num: user.contact_num, // Client-specific data
            img_url: user.img_url, // Include profile image if available
          };
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          img_url: user.img_url, // Include profile image if available
        };
      });

      res.status(200).json({
        message: `Search successful`,
        users: usersWithClientData,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Users
app.get(
  "/view-users",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      // Join users with clients table, only for 'Client' role
      const users = await db("users")
        .leftJoin("clients", "users.id", "clients.client_id") // Left join on clients table
        .select("users.*", "clients.*") // Select all user fields and client fields
        .whereIn("users.role", ["Admin", "Client", "WarehouseMan", "Supervisor", "PlantOfficer", "Guard"]); // Ensure we only return relevant roles

      if (!users || users.length === 0) {
        return res.status(200).json({
          message: "No matching User found.",
        });
      }

      // Organize the response to differentiate client data
      const usersWithClientData = users.map(user => {
        if (user.role === 'Client') {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            org_name: user.org_name,
            comp_add: user.comp_add,
            contact_num: user.contact_num,
            img_url: user.img_url, // include profile image if available
          };
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          img_url: user.img_url, // include profile image if available
        };
      });

      res.status(200).json({
        message: `Users Viewed successfully`,
        users: usersWithClientData,
      });
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
  uploadImage("profilePictures"), // Middleware to process image uploads
  async (req, res) => {
    const trx = await db.transaction();

    try {
      const { id } = req.params;
      const { name, email, role, org_name, comp_add, contact_num, password } = req.body;
      let { image } = req.file;

      const validRoles = [
        "WarehouseMan",
        "Supervisor",
        "PlantOfficer",
        "Guard",
        "Admin",
        "Client",
      ];

      // Fetch current user data
      const user = await trx("users").where({ id }).first();
      if (!user) {
        await trx.rollback();
        return res.status(404).json({ error: "User not found" });
      }

      const currentRole = user.role;

      // Validate role only if it's provided and not empty
      const trimmedRole = role?.trim();
      if (trimmedRole && !validRoles.includes(trimmedRole)) {
        await trx.rollback();
        return res.status(400).json({ error: "Invalid role provided" });
      }

      // Hash new password if provided
      let hashedPassword = user.password_hash;
      if (password && password.trim() !== "") {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Handle image upload and deletion
      if (req.file) {
        if (user.img_url && user.img_url !== DEFAULT_IMAGE) {
          const oldImagePath = path.join(__dirname, "public", user.img_url);
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error("Failed to delete old image:", err.message);
            }
          });
        }
        image = `/assets/profilePictures/${req.file.filename}`;
      } else if (!image || image.trim() === "") {
        image = user.img_url || DEFAULT_IMAGE;
      }

      // Prepare updated data (fall back to current values if missing or empty)
      const updatedData = {
        name: name?.trim() !== "" ? name : user.name,
        email: email?.trim() !== "" ? email : user.email,
        role: trimmedRole || user.role,
        password_hash: hashedPassword,
        img_url: image,
      };

      // Update users table
      const updatedRows = await trx("users").where("id", id).update(updatedData);
      if (!updatedRows) {
        await trx.rollback();
        return res.status(404).json({ message: "No matching user found" });
      }

      const updatedUser = await trx("users").where({ id }).first();
      updatedUser.img_url = updatedUser.img_url || DEFAULT_IMAGE;

      let client = null;

      if (updatedData.role === "Client") {
        const existingClient = await trx("clients").where({ client_id: id }).first();

        const clientData = {
          org_name: org_name?.trim() !== "" ? org_name : existingClient?.org_name || "",
          comp_add: comp_add?.trim() !== "" ? comp_add : existingClient?.comp_add || "",
          contact_num: contact_num?.trim() !== "" ? contact_num : existingClient?.contact_num || "",
        };

        if (existingClient) {
          await trx("clients").where({ client_id: id }).update(clientData);
        } else {
          await trx("clients").insert({
            client_id: id,
            ...clientData,
          });
        }

        client = await trx("clients").where({ client_id: id }).first();
      } else if (currentRole === "Client" && updatedData.role !== "Client") {
        await trx("clients").where({ client_id: id }).del();
      }

      await trx.commit();

      res.status(200).json({
        message: "User updated successfully",
        updatedUser,
        client,
      });
    } catch (error) {
      await trx.rollback();
      console.error("Update error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.delete(
  "/delete-user/:id",
  authenticateToken,
  authorizePermission("delete_users"),
  async (req, res) => {
    const trx = await db.transaction();

    try {
      const { id } = req.params;

      // Check if user exists
      const user = await trx("users").where({ id }).first();
      if (!user) {
        return res.status(404).json({ message: "No matching User found." });
      }

      // Check if the user is a Client and find corresponding client record
      let client = null;
      if (user.role === "Client") {
        client = await trx("clients").where({ client_id: id }).first();
        if (!client) {
          return res.status(404).json({ message: "No matching Client found." });
        }
      }

      // Delete the user record (this will trigger the cascade delete for the client record)
      await trx("users").where("id", id).del();

      await trx.commit();

      // Return success response
      if (user.role === "Client") {
        res.status(200).json({
          message: "Client deleted successfully.",
          user,
          client,
        });
      } else {
        res.status(200).json({
          message: "User deleted successfully.",
          user,
        });
      }
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);


module.exports = app;
