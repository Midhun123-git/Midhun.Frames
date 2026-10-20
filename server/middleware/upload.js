
const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
 limits: {
  fileSize: 1024 * 1024 * 1024, // 1 GB per image
  files: 10, // Up to 10 images per request
},
});

module.exports = upload;
