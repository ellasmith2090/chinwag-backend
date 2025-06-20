// middleware/upload.js

const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

const ensureDir = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error("[upload.js] Failed to create directory:", err);
    throw err;
  }
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(
      __dirname,
      "../uploads",
      req.fieldname === "avatar" ? "avatar" : "event"
    );
    await ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.fieldname}-${req.user.id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === "Only JPEG and PNG images are allowed") {
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

const resizeImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const dimensions =
      req.file.fieldname === "avatar"
        ? { width: 200, height: 200 }
        : { width: 800, height: 600 };
    const buffer = await sharp(req.file.path)
      .resize(dimensions.width, dimensions.height, { fit: "cover" })
      .png()
      .toBuffer();
    await sharp(buffer).toFile(req.file.path);
    next();
  } catch (err) {
    console.error("[upload.js] Image processing failed:", err);
    res.status(500).json({ message: "Image processing failed" });
  }
};

module.exports = { upload, resizeImage, handleMulterError };
