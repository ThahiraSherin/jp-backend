const Job = require('../models/Job');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc: Get all jobs with filtering, sorting and pagination
// @route: GET /api/jobs
// @access: Public
const getJobs = async (req, res) => {
    try {
        // to show how many jobs we have in the database
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // calculate the number of documents to skip, that we have already showed in the previous pages
        const skip = (page - 1) * limit;

        // build the filter object based on query parameters
        const filter = {
            status: 'active'   // only show active jobs
        }

        // location filter
        if (req.query.location) {
            filter.location = {
                $regex: req.query.location,
                $options: 'i' // case-insensitive search
            }
        }

        // job type filter
        if (req.query.jobType) {
            filter.jobType = req.query.jobType;
        }

        // category filter
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // experience level filter
        if (req.query.experienceLevel) {
            filter.experienceLevel = req.query.experienceLevel;
        }

        // salary range filter
        if (req.query.minSalary || req.query.maxSalary) {
            filter['salary-min'] = {};

            if (req.query.minSalary) {
                filter['salary.min'].$gte = parseInt(req.query.minSalary);
            }

            if (req.query.maxSalary) {
                filter['salary.max'].$lte = parseInt(req.query.maxSalary);
            }
        }

        // remote filter
        if (req.query.isRemote === 'true') {
            filter.isRemote = true;
        }

        // build sort object
        let sort = {};

        if (req.query.sortBy) {
            const [field, order] = req.query.sortBy.split(':');
            sort[field] = order === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1; // default sort by createdAt descending    
        }

        const jobs = await Job.find(filter)
            .populate('postedBy', 'name company.name company.logo')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Job.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: jobs.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            jobs
        });
    } catch (error) {
        console.error('Get Jobs error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs'
        });
    }
}


// @desc: Create a new job
// @route: POST /api/jobs
// @access: Private (Employer/Admin only)
const createJob = async (req, res) => {
    try {
        // check for validation errors
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // add user to req body
        req.body.postedBy = req.user.id;

        // if user doesn't have company info, use provided company name
        if (!req.user.company.name && req.body.company) {
            req.body.company = req.body.company;
        } else if (req.user.company.name) {
            req.body.company = req.user.company.name;
        }

        // create the job in the database
        const job = await Job.create(req.body);

        res.status(201).json({
            success: true,
            job
        });
    } catch (error) {
        console.error('Create Job error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while creating job'
        });
    }
}

// @desc: Update a job
// @route: PUT /api/jobs/:id
// @access: Private (Employer/Admin only)
const updateJob = async (req, res) => {
    try {
        let job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // make sure user is job author or admin
        if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this job'
            });
        }

        job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            job
        });

    } catch (error) {
        console.error('Update Job error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while updating job'
        });
    }
}

// @desc: Delete a job
// @route: DELETE /api/jobs/:id
// @access: Private (Employer/Admin only)
const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        // check if job exists
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // make sure user is job author or admin
        if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this job'
            });
        }

        await Job.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        console.error('Delete Job error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting job'
        });
    }
}
// @desc: Get jobs posted by the authenticated user
// @route: GET /api/jobs/employer/my-jobs
// access: Employer/Admin
const getMYJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const jobs = await Job.find({ postedBy: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        const total = await Job.countDocuments({ postedBy: req.user.id });

        res.status(200).json({
            success: true,
            count: jobs.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            jobs
        });
    } catch (error) {
        console.error('Get My Jobs error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user jobs'
        });
    }
}
// @desc: Search jobs based on query parameters
// @route: GET /api/jobs/search
// @access: Public
const searchJobs = async (req, res) => {
    try {
        const { q, location, page = 1, limit = 10 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const skip = parseInt((page - 1)) * parseInt(limit);

        const filter = {
            status: 'active', // only show active jobs
            $text: { $search: q } // full-text search
        }

        if (location) {
            filter.location = {
                $regex: location,
                $options: 'i' // case-insensitive search
            }
        }

        const jobs = await Job.find(filter, { score: { $meta: 'textScore' } })
            .populate('postedBy', 'name company.name company.logo')
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Job.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: jobs.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            jobs
        });
    } catch (error) {
        console.error('Search Jobs error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while searching jobs'
        });
    }
}

// @desc: Get job statistics (e.g., total jobs, active jobs, etc.)
// @route: GET /api/jobs/stats
// @access: Public
const getJobsStats = async (req, res) => {
    try {
        const stats = await Job.aggregate([
            {
                $match: { status: 'active' } // only count active jobs
            },
            {
                $group: {
                    _id: null,
                    totalJobs: { $sum: 1 },
                    avgSalaryMin: { $avg: '$salary.min' },
                    avgSalaryMax: { $avg: '$salary.max' },
                    totalViews: { $sum: '$views' },
                }
            }
        ]);

        const categoryStats = await Job.aggregate([
            {
                $match: { status: 'active' } // only count active jobs
            },
            {
                $group: {
                    _id: '$category',
                    totalJobs: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 } // sort by total jobs descending
            },
            {
                $limit: 10 // limit to top 10 categories
            }
        ]);

        const locationStats = await Job.aggregate([
            {
                $match: { status: 'active' } // only count active jobs
            },
            {
                $group: {
                    _id: '$location',
                    totalJobs: { $sum: 1 }
                }
            },
            {
                $sort: { totalJobs: -1 } // sort by total jobs descending
            },
            {
                $limit: 10 // limit to top 10 locations
            }
        ]);

        res.status(200).json({
            success: true,
            stats: stats[0] || {
                totalJobs: 0,
                avgSalaryMin: 0,
                avgSalaryMax: 0,
                totalViews: 0
            },
            categoryStats,
            locationStats
        })

    } catch (error) {
        console.error('Get Jobs Stats error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching job statistics'
        });
    }
}

// @desc: Get single job by id or slug
// @route: GET /api/jobs/:id
// @access: Public
const getJob = async (req, res) => {
    try {
        const { id } = req.params;

        // Determine if id is an ObjectId
        const isObjectId = id && id.match(/^[0-9a-fA-F]{24}$/);

        let job;
        if (isObjectId) {
            job = await Job.findById(id).populate('postedBy', 'name company');
        } else {
            // treat as slug
            job = await Job.findOne({ slug: id }).populate('postedBy', 'name company');
        }

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // increment views
        job.views = (job.views || 0) + 1;
        await job.save();

        res.status(200).json({ success: true, job });
    } catch (error) {
        console.error('Get Job error:', error.message);
        res.status(500).json({ success: false, message: 'Server error while fetching job' });
    }
}

module.exports = {
    getJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    getMYJobs,
    searchJobs,
    getJobsStats
};
