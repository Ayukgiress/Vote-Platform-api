import mongoose from 'mongoose';

const contestantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    required: true
  }
});

const contestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  coverPhotoUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  contestants: [contestantSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Contest = mongoose.model('Contest', contestSchema);
export default Contest;