import mongoose from "mongoose";

const contestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: false
  },
  coverPhotoUrl: {
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
  isPublished: {
    type: Boolean,
    default: false
  },
  hasEnded: {
    type: Boolean,
    default: false
  },
  contestants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contestant'
  }]
}, {
  timestamps: true
});

// Add method to check if contest is active
contestSchema.methods.isActive = function() {
  const now = new Date();
  return this.isPublished && 
         now >= this.startDate && 
         now <= this.endDate;
};

const Contest = mongoose.model('Contest', contestSchema);
export default Contest;