import express from "express";
const router = express.Router();
import Contest from "../models/contest.js";
import multer from "multer";
import Contestant from "../models/contestants.js";
import uploadMiddleware from "../middleware/upload.js";
import path from "path";
import auth from "../middleware/auth.js";
import Vote from "../models/vote.js";
import mongoose from "mongoose";

const contestUpload = uploadMiddleware.fields([
  { name: "coverPhoto", maxCount: 1 },
  { name: "contestants", maxCount: 10 },
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const calculateWinners = async (contest) => {
  const now = new Date();
  const endDate = new Date(contest.endDate);
  
  if (endDate < now && contest.contestants?.length > 0) {
    const maxVotes = Math.max(...contest.contestants.map(c => c.votes || 0));
    
    const winnerIds = contest.contestants
      .filter(c => (c.votes || 0) === maxVotes)
      .map(c => c._id);
    
    await Contestant.updateMany(
      { contestId: contest._id },
      { isWinner: false }
    );
    
    await Contestant.updateMany(
      { 
        contestId: contest._id,
        _id: { $in: winnerIds }
      },
      { isWinner: true }
    );
    
    contest.hasEnded = true;
    await contest.save();
  }
  
  return contest;
};

router.post("/", auth, upload.single('coverPhoto'), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("File:", req.file);

    const { name, description, startDate, endDate } = req.body;
    const userId = req.user._id; 

    if (!name || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        received: { name, description, startDate, endDate }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Cover photo is required"
      });
    }

    const contest = new Contest({
      userId,
      name,
      description,
      coverPhotoUrl: req.file.path,
      startDate,
      endDate,
      contestants: []
    });

    await contest.save();

    res.status(201).json({
      success: true,
      data: contest
    });
  } catch (error) {
    console.error("Error creating contest:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error creating contest"
    });
  }
});


router.get("/all", async (req, res) => {
  try {
    const contests = await Contest.find()
      .populate('contestants')
      .sort({ createdAt: -1 });
    
    const processedContests = await Promise.all(
      contests.map(contest => calculateWinners(contest))
    );
      
    res.json({
      success: true,
      data: processedContests,
    });
  } catch (error) {
    console.error("Error fetching all contests:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching contests",
    });
  }
});



router.post("/:contestId/contestants", contestUpload, async (req, res) => {
  try {
    const { contestId } = req.params;
    const { contestants } = req.body;
    
    const contestantPhotos = req.files.contestants || [];

    if (!contestants || !Array.isArray(contestants)) {
      return res.status(400).json({ 
        success: false, 
        error: "Contestants should be an array" 
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ 
        success: false, 
        error: "Contest not found" 
      });
    }

    const contestantsWithPhotos = contestants.map((contestant, index) => ({
      name: contestant,
      photoUrl: contestantPhotos[index] ? contestantPhotos[index].path : "",
      contestId: contestId
    }));

    const newContestants = await Contestant.insertMany(contestantsWithPhotos);
    contest.contestants.push(...newContestants.map(c => c._id));
    await contest.save();

    res.status(200).json({
      success: true,
      data: contest,
    });
  } catch (error) {
    console.error("Error adding contestants:", error);
    res.status(500).json({
      success: false,
      error: "Error adding contestants to contest",
    });
  }
});

router.patch("/:contestId/publish", auth, async (req, res) => {
  const { contestId } = req.params;
  const { isPublished } = req.body;

  try {
    const contest = await Contest.findById(contestId).populate('contestants');

    if (!contest) {
      return res.status(404).json({ 
        success: false, 
        error: "Contest not found" 
      });
    }

    if (contest.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: "You do not have permission to modify this contest" 
      });
    }

    if (isPublished && (!contest.contestants || contest.contestants.length === 0)) {
      return res.status(400).json({
        success: false,
        error: "Cannot publish contest without contestants",
      });
    }

    contest.isPublished = isPublished;

    await contest.save();

    const updatedContest = await Contest.findById(contestId).populate('contestants');

    res.json({
      success: true,
      message: isPublished ? "Contest published!" : "Contest unpublished",
      data: updatedContest,
    });
  } catch (error) {
    console.error("Error updating contest publish status:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update contest publish status" 
    });
  }
});


router.get("/published", async (req, res) => {
  try {
    const contests = await Contest.find({ isPublished: true })
      .populate('contestants')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: contests,
    });
  } catch (error) {
    console.error("Error fetching published contests:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching published contests",
    });
  }
});



router.get('/:contestId', async (req, res) => {
  try {
    const contest = await Contest.findOne({
      _id: req.params.contestId,
      isPublished: true
    }).populate('contestants');

    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found or not published'
      });
    }

    res.json({
      success: true,
      contest
    });
  } catch (error) {
    console.error('Error fetching contest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contest details'
    });
  }
});



router.get("/contests/:contestId/contestants", async (req, res) => {
  try {
    const contestId = req.params.contestId;
    const contest = await Contest.findById(contestId).populate("contestants"); 
    res.json({ success: true, contestants: contest.contestants });
  } catch (error) {
    console.error("Error fetching contestants:", error);
    res.status(500).json({ success: false, message: "Error fetching contestants" });
  }
});


router.get("/", async (req, res) => {
  try {
    const contests = await Contest.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: contests,
    });
  } catch (error) {
    console.error("Error fetching contests:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching contests",
    });
  }
});

router.get("/:contestId/contestants", async (req, res) => {
  try {
    const contestId = req.params.contestId;
    const contest = await Contest.findById(contestId)
      .populate('contestants');

    if (!contest) {
      return res.status(404).json({ 
        success: false, 
        message: "Contest not found" 
      });
    }

    res.json({ 
      success: true, 
      data: contest.contestants 
    });
  } catch (error) {
    console.error("Error fetching contestants:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching contestants" 
    });
  }
});




router.post("/:contestId/vote", auth, async (req, res) => {
  const { contestId } = req.params;
  const { contestantId } = req.body;
  const voterId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(contestId) || 
        !mongoose.Types.ObjectId.isValid(contestantId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid contest or contestant ID"
      });
    }

    const contest = await Contest.findOne({
      _id: contestId,
      isPublished: true,
      contestants: contestantId
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        error: "Contest not found or contestant not in this contest"
      });
    }

    const now = new Date();
    const endDate = new Date(contest.endDate);
    if (endDate < now) {
      return res.status(400).json({
        success: false,
        error: "Contest has ended"
      });
    }

    const existingVote = await Vote.findOne({
      contestId,
      contestantId,
      voterId
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        error: "You have already voted for this contestant"
      });
    }

    await Vote.create({
      contestId,
      contestantId,
      voterId
    });

    const updatedContestant = await Contestant.findOneAndUpdate(
      {
        _id: contestantId,
        contestId: contestId
      },
      { $inc: { votes: 1 } },
      { new: true }
    );

    if (!updatedContestant) {
      await Vote.deleteOne({ contestId, contestantId, voterId });
      return res.status(404).json({
        success: false,
        error: "Failed to update contestant votes"
      });
    }

    const updatedContest = await Contest.findById(contestId)
      .populate('contestants');
    
    res.json({
      success: true,
      message: "Vote recorded successfully",
      currentVotes: updatedContestant.votes,
      contest: updatedContest
    });

  } catch (error) {
    console.error("Voting error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process vote"
    });
  }
});


router.get("/:contestId/winners", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId)
      .populate('contestants');
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: "Contest not found"
      });
    }

    const winners = contest.contestants.filter(c => c.isWinner);
    
    res.json({
      success: true,
      data: {
        hasEnded: new Date(contest.endDate) < new Date(),
        winners
      }
    });
  } catch (error) {
    console.error("Error fetching winners:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch winners"
    });
  }
});



router.get("/view/:contestId", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId)
      .where("isPublished")
      .equals(true);  

    if (!contest) {
      return res
        .status(404)
        .json({ success: false, error: "Contest not found" });
    }

    res.json({ success: true, data: contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


router.post("/:contestId/vote/:contestantId", async (req, res) => {
  try {
    const { contestId, contestantId } = req.params;

    const contest = await Contest.findOneAndUpdate(
      {
        _id: contestId,
        "contestants._id": contestantId,
        isPublished: true,
      },
      { $inc: { "contestants.$.votes": 1 } },
      { new: true }
    );

    if (!contest) {
      return res.status(404).json({
        success: false,
        error: "Contest or contestant not found",
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
