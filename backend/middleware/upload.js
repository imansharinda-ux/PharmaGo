const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', 'uploads');

const storageFor = sub => {
  const dir = path.join(ROOT, sub);
  fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '').toLowerCase().replace(/[^.a-z0-9]/g, '');
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    }
  });
};

const isImage = f => /^image\//.test(f.mimetype);
const isPdf = f => f.mimetype === 'application/pdf';

// Prescription photos / PDFs: up to 5 files, 10 MB each
exports.prescriptionUpload = multer({
  storage: storageFor('prescriptions'),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => (isImage(file) || isPdf(file)) ? cb(null, true) : cb(new Error(`${file.originalname} is not a photo or PDF`))
}).array('files', 5);

// Product photo added by the admin
exports.productImageUpload = multer({
  storage: storageFor('products'),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => isImage(file) ? cb(null, true) : cb(new Error('Product photo must be an image'))
}).single('image');

// Wraps a multer middleware so its errors come back as 400 JSON
exports.handleUpload = mw => (req, res, next) => mw(req, res, err => {
  if (!err) return next();
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Each file must be 10 MB or smaller'
    : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can upload up to 5 files'
    : err.message;
  res.status(400).json({ error: msg });
});

exports.UPLOAD_ROOT = ROOT;
