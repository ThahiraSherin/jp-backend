const { validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');

const applyForJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { jobId } = req.params;
    const { coverLetter } = req.body;

    const job = await Job.findById(jobId).populate('postedBy');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Job is not currently active' });
    }

    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }

    const existingApplication = await Application.findOne({ job: jobId, applicant: req.user.id });
    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    if (job.postedBy._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot apply for your own job' });
    }

    const resumePath = req.file ? req.file.path : (req.user.profile && req.user.profile.resume);
    if (!resumePath) {
      return res.status(400).json({ success: false, message: 'Resume is required to apply for a job' });
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user.id,
      coverLetter,
      resume: resumePath,
    });

    job.applicationsCount = (job.applicationsCount || 0) + 1;
    await job.save();

    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company location')
      .populate('applicant', 'name email');

    res.status(201).json({ success: true, message: 'Application submitted successfully', application: populatedApplication });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ success: false, message: 'Server error while applying for job' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { applicant: req.user.id };
    if (req.query.status) filter.status = req.query.status;

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
      applications,
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to view these applications' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { job: jobId };
    if (req.query.status) filter.status = req.query.status;

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
      applications,
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid status provided' });

    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await Application.findById(id).populate('job').populate('applicant');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (application.job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this application' });
    }

    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    if (notes) application.notes = notes;

    await application.save();

    res.status(200).json({ success: true, message: 'Application status updated successfully', application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate('job');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (application.applicant.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to withdraw this application' });
    }

    if (['hired', 'rejected'].includes(application.status)) {
      return res.status(400).json({ success: false, message: 'Cannot withdraw application with current status' });
    }

    await Application.findByIdAndDelete(id);

    const job = await Job.findById(application.job._id);
    if (job) {
      job.applicationsCount = Math.max(0, job.applicationsCount - 1);
      await job.save();
    }

    res.status(200).json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid application id' });

    const application = await Application.findById(id)
      .populate('job', 'title company location salary requirements')
      .populate('applicant', 'name email phone profile')
      .populate('reviewedBy', 'name');

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    const isApplicant = application.applicant._id.toString() === req.user.id;
    const isJobOwner = application.job.postedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isApplicant && !isJobOwner && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this application' });
    }

    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplication,
};
