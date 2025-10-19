const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    withdrawApplication,
    getApplication } = require('../controllers/applications');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

const applicationValidation = [
    body('coverLetter').optional().isLength({ max: 1000 }).withMessage('Cover letter cannot be more than 1000 characters long'),
];

// Job seeker routes
router.post('/:jobId/apply', upload.single('resume'), applicationValidation, applyForJob);
// alias route for frontend compatibility (some clients call '/my')
router.get('/my-applications', authorize('jobseeker'), getMyApplications);
router.get('/my', authorize('jobseeker'), getMyApplications);
router.delete('/:id/withdraw', authorize('jobseeker'), withdrawApplication);

// Employer routes
router.get('/job/:jobId', authorize('employer', 'admin'), getJobApplications);
router.put('/:id/status', authorize('employer', 'admin'),
    body('status').isIn(['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected']),
    updateApplicationStatus
);

// Common routes
router.get('/:id', getApplication);

module.exports = router;