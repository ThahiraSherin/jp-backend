const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('../models/Job');
const { MONGODB_URI } = require('../utils/config');

async function generateSlugs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for slug generation');

    const jobs = await Job.find({ $or: [{ slug: { $exists: false } }, { slug: null }] });
    console.log(`Found ${jobs.length} jobs missing slugs`);

    for (const job of jobs) {
      // touch title to trigger pre-save slug generation
      job.title = job.title;
      await job.save();
      console.log(`Generated slug for job ${job._id}: ${job.slug}`);
    }

    console.log('Slug generation complete');
    process.exit(0);
  } catch (err) {
    console.error('Slug generation failed', err);
    process.exit(1);
  }
}

generateSlugs();
