import mongoose from "mongoose";

const contestantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String
  },
  votes: {
    type: Number,
    default: 0
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  isWinner: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

contestantSchema.methods.getVoteCount = async function() {
  return this.votes;
};

const Contestant = mongoose.model("Contestant", contestantSchema);
export default Contestant;
