const multer = require('multer');
const path = require('path');
const fs = require('fs');

// create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';

        if (file.fieldname === 'resume') {
            uploadPath = 'uploads/resumes/';
        } else if (file.fieldname === 'profilePicture') {
            uploadPath = 'uploads/profiles/';
        } else if (file.fieldname === 'companyLogo') {
            uploadPath = 'uploads/logos/';
        }

        // create directory if it doesn't exist
        const fullPath = path.join(__dirname, '../', uploadPath);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

module.exports = upload;