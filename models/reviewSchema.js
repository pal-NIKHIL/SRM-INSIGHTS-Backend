const mongoose = require("mongoose");
const createReviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  content: { type: String, required: true },
  upvotes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "users", default: [] },
  ],
  downvotes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "users", default: [] },
  ],
  avatar: { type: String, required: true },
});
const CreateReview = mongoose.model("Reviews", createReviewSchema);
module.exports = CreateReview;
