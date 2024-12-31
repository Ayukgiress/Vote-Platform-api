import mongoose from "mongoose";

// Contestant Schema
const contestantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  photoUrl: {
    type: String,
    required: true,
  },
});

// Contest Schema
const contestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,  
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  coverPhotoUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  contestants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contestant",  
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Contest = mongoose.model("Contest", contestSchema);
export default Contest;
