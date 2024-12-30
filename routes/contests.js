import express from 'express';
const router = express.Router();
import Contest from '../models/contest.js';
import upload from '../middleware/upload.js';

// Configure multer to accept multiple files with specific field names
const contestUpload = upload.fields([
  { name: 'coverPhoto', maxCount: 1 }, // Name should be 'coverPhoto'
  { name: 'contestants', maxCount: 10 }
]);

// POST endpoint to create a contest
router.post('/', contestUpload, async (req, res) => {
  try {
    console.log('Files received:', req.files);
    console.log('Body received:', req.body);

    if (!req.files) {
      return res.status(400).json({
        success: false,
        error: 'No files were uploaded',
        files: req.files
      });
    }

    if (!req.files.coverPhoto) {
      return res.status(400).json({
        success: false,
        error: 'Cover photo is required',
        filesReceived: Object.keys(req.files)
      });
    }

    const { name, description, startDate, endDate, contestants } = req.body;

    // Validate required fields
    if (!name || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        received: { name, description, startDate, endDate }
      });
    }

    let parsedContestants = [];
    try {
      parsedContestants = JSON.parse(contestants || '[]');
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contestants data format',
        received: contestants
      });
    }

    const coverPhotoUrl = req.files.coverPhoto[0].path;
    const contestantPhotos = req.files.contestants || [];
    // ... rest of your code

    // Map contestants to include their photos
    const contestantsWithPhotos = parsedContestants.map((contestant, index) => ({
      name: contestant.name,
      photoUrl: contestantPhotos[index] ? contestantPhotos[index].path : '' // Photo path for each contestant
    }));

    // Create the contest document
    const contest = new Contest({
      name,
      description,
      coverPhotoUrl,
      startDate,
      endDate,
      contestants: contestantsWithPhotos
    });

    // Save the contest to the database
    await contest.save();

    // Return the created contest as a response
    res.status(201).json({
      success: true,
      data: contest
    });
  } catch (error) {
    console.error('Error creating contest:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating contest'
    });
  }
});

// Route to get all contests
router.get('/', async (req, res) => {
  try {
    const contests = await Contest.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: contests
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching contests'
    });
  }
});

// Route to get a specific contest by ID
router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }
    res.json({
      success: true,
      data: contest
    });
  } catch (error) {
    console.error('Error fetching contest:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching contest'
    });
  }
});

export default router;
