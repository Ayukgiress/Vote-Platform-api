import express from 'express';
const router = express.Router();
import Contest from '../models/contest.js';
import multer from 'multer'; 
import Contestant from '../models/contestants.js';
import uploadMiddleware from '../middleware/upload.js'; 
import path from 'path'

const contestUpload = uploadMiddleware.fields([
  { name: 'coverPhoto', maxCount: 1 }, 
  { name: 'contestants', maxCount: 10 }
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

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

    router.patch("/contests/:contestId/publish", authenticate, async (req, res) => {
      const { contestId } = req.params;
      const { isPublished } = req.body; 
    
      try {
        const contest = await Contest.findById(contestId);
    
        if (!contest) {
          return res.status(404).json({ error: "Contest not found" });
        }
    
        if (contest.userId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: "You do not have permission to modify this contest" });
        }
    
        contest.isPublished = isPublished;
        await contest.save();
    
        res.json({ success: true, message: isPublished ? "Contest published!" : "Contest unpublished", data: contest });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update contest publish status" });
      }
    });
    

    const { name, description, startDate, endDate, contestants, userId } = req.body;

    if (!name || !description || !startDate || !endDate || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        received: { name, description, startDate, endDate, userId }
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

    const contestantsWithPhotos = parsedContestants.map((contestant, index) => ({
      name: contestant.name,
      photoUrl: contestantPhotos[index] ? contestantPhotos[index].path : '' 
    }));

    const contest = new Contest({
      userId,
      name,
      description,
      coverPhotoUrl,
      startDate,
      endDate,
      contestants: contestantsWithPhotos
    });

    await contest.save();

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

router.post('/:contestId/contestants', upload.single('photo'), async (req, res) => {
  try {
    const { name } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const newContestant = new Contestant({
      name,
      photoUrl,
      contestId: req.params.contestId,
    });

    await newContestant.save();

    res.status(201).json({
      success: true,
      data: {
        name: newContestant.name,
        photoUrl: newContestant.photoUrl,  
      },
    });
  } catch (error) {
    console.error('Error adding contestant:', error);
    res.status(500).json({ error: 'Failed to add contestant' });
  }
});

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


router.get('/:userId', async (req, res) => {
  try {
    const contests = await Contest.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
      
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

export default router;
