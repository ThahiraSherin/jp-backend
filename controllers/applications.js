const { validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

const applyForJob = async (req, res) => {
    try {
        // check for validation errors
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { jobId } = req.params;
        const { coverLetter } = req.body;

        // check if job exists and is active
        const job = await Job.findById(jobId).populate('postedBy');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Job is not currently active'
            });
        }

        // check if application deadline is passed
        if (new Date() > job.applicationDeadline) {
            return res.status(400).json({
                success: false,
                message: 'Application deadline has passed'
            });
        }

        // check if the user already applied for this job
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: req.user.id
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }

        // check if employer is trying to apply for their own job
        if (job.postedBy._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot apply for your own job'
            });
        }

        // use uploaded resume or user's profile resume
        const resumePath = req.file ? req.file.path : req.user.profile.resume;

        if (!resumePath) {
            return res.status(400).json({
                success: false,
                message: 'Resume is required to apply for a job'
            });
        }

        const application = await Application.create({
            job: jobId,
            applicant: req.user.id,
            coverLetter,
            resume: resumePath
        })

        // update job applications count
        job.applicationsCount += 1;
        await job.save();

        const populatedApplication = await Application.findById(application._id)
            .populate('job', 'title company location')
            .populate('applicant', 'name email');

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: populatedApplication
        });
    } catch (error) {
        console.error('Error applying for job:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while applying for job'
        });
    }
}
// @desc    Get current user's applications
// @route   GET /api/applications/my-applications
// @access  Private (Job seeker)
const getMyApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let filter = { applicant: req.user.id };

        // Status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const applications = await Application.find(filter)
            .populate('job', 'title company location salary status applicationDeadline')
            .populate('applicant', 'name email')
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Application.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: applications.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            applications
        });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get applications for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer/Admin)
const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Check if job exists and user owns it
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to view these applications'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let filter = { job: jobId };

        // Status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const applications = await Application.find(filter)
            .populate('applicant', 'name email phone profile')
            .populate('job', 'title company')
            .sort({ appliedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Application.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: applications.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            applications
        });
    } catch (error) {
        console.error('Get job applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Employer/Admin)
const updateApplicationStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status provided'
            });
        }

        const { id } = req.params;
        const { status, notes } = req.body;

        const application = await Application.findById(id)
            .populate('job')
            .populate('applicant');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check authorization
        if (application.job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this application'
            });
        }

        // Update application
        application.status = status;
        application.reviewedAt = new Date();
        application.reviewedBy = req.user.id;

        if (notes) {
            application.notes = notes;
        }

        await application.save();

        res.status(200).json({
            success: true,
            message: 'Application status updated successfully',
            application
        });
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Withdraw application
// @route   DELETE /api/applications/:id/withdraw
// @access  Private (Job seeker)
const withdrawApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findById(id).populate('job');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if user owns the application
        if (application.applicant.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to withdraw this application'
            });
        }

        // Check if application can be withdrawn
        if (['hired', 'rejected'].includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot withdraw application with current status'
            });
        }

        await Application.findByIdAndDelete(id);

        // Update job applications count
        const job = await Job.findById(application.job._id);
        if (job) {
            job.applicationsCount = Math.max(0, job.applicationsCount - 1);
            await job.save();
        }

        res.status(200).json({
            success: true,
            message: 'Application withdrawn successfully'
        });
    } catch (error) {
        console.error('Withdraw application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
const getApplication = async (req, res) => {
    try {
        // Validate ObjectId to avoid CastError when invalid id is provided
        const { id } = req.params;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid application id' });
        }

        const application = await Application.findById(id)
            .populate('job', 'title company location salary requirements')
            .populate('applicant', 'name email phone profile')
            .populate('reviewedBy', 'name');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check authorization - applicant, job owner, or admin
        const isApplicant = application.applicant._id.toString() === req.user.id;
        const isJobOwner = application.job.postedBy.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isApplicant && !isJobOwner && !isAdmin) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to view this application'
            });
        }

        res.status(200).json({
            success: true,
            application
        });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    withdrawApplication,
    getApplication
};