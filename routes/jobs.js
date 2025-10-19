const express = require('express');
const { body } = require('express-validator');
const { getJobs, searchJobs, getJobsStats, getJob, createJob, updateJob, deleteJob, getMYJobs } = require('../controllers/jobs');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const jobValidation = [
    body('title').notEmpty().withMessage('Job title is required'),
    body('description').notEmpty().withMessage('Job description is required'),
    body('location').notEmpty().withMessage('Job location is required'),
    // body('salary').optional().isNumeric().withMessage('Salary must be a number'),
    body('company').notEmpty().withMessage('Company name is required'),
    body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'remote']).withMessage('Job category is required.'),
    body('category').notEmpty().withMessage('Job category is required'),
    body('skills').optional().isArray({ min: 1 }).withMessage('At least one skill is required'),
    body('experienceLevel').isIn(['entry-level', 'mid-level', 'senior-level', 'executive']),
    // body('salary.min').optional().isNumeric().withMessage('Minimum salary must be a number'),
    // body('salary.max').optional().isNumeric().withMessage('Maximum salary must be a number'),
    body('applicationDeadline').isISO8601().withMessage('Application deadline must be a valid date in ISO format')
]

// public routes
router.get('/', getJobs);
router.get('/search', searchJobs);
router.get('/stats', getJobsStats);
router.get('/:id', getJob);

// protected routes
router.use(protect);

// Employer only routes
router.post('/', authorize('employer', 'admin'), jobValidation, createJob);
router.put('/:id', authorize('employer', 'admin'), jobValidation, updateJob);
router.delete('/:id', authorize('employer', 'admin'), deleteJob);
router.get('/employer/my-jobs', authorize('employer', 'admin'), getMYJobs);

module.exports = router;