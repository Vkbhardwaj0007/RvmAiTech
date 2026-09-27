const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UP = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UP)) fs.mkdirSync(UP, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UP),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').slice(0, 30);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
function fileFilter(req, file, cb) {
  if (/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) return cb(null, true);
  if (/^video\/(mp4|webm|ogg|quicktime|x-msvideo)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image or video files allowed'));
}
// resumes (careers form): pdf / doc / docx, 5 MB, saved under uploads/resumes
const RESUMES = path.join(UP, 'resumes');
if (!fs.existsSync(RESUMES)) fs.mkdirSync(RESUMES, { recursive: true });
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RESUMES),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').slice(0, 40);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
function resumeFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const okType = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/.test(file.mimetype);
  if (okType && /^\.(pdf|doc|docx)$/.test(ext)) return cb(null, true);
  cb(new Error('Resume must be a PDF, DOC or DOCX file'));
}
const resumeUpload = multer({ storage: resumeStorage, fileFilter: resumeFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { upload: multer({ storage, fileFilter, limits: { fileSize: 60 * 1024 * 1024 } }), resumeUpload, UP };
