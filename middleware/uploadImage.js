const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// Helper function to ensure a directory exists
const ensureDirectoryExists = (dir) => {
  const folderPath = path.join(__dirname, "..", "assets", dir);
  fs.mkdirSync(folderPath, { recursive: true }); // Ensure the folder is created
  return folderPath;
};

// Multer storage configuration
const storage = (directory) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const folderPath = ensureDirectoryExists(directory); // Create folder if not exists
      cb(null, folderPath); // Save images to the specified folder
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = crypto.randomBytes(16).toString("hex") + ext;
      cb(null, uniqueName); // Store with a unique name
    },
  });
};

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Custom multer middleware to handle file upload for a specific directory
const uploadImage = (directory) => {
  const upload = multer({ storage: storage(directory), fileFilter });
  return (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err && err.message !== "Unexpected field") {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

module.exports = uploadImage;
