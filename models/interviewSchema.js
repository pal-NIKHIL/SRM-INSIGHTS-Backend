const mongoose = require("mongoose");
const InterviewSchema = new mongoose.Schema({
  date: { type: Date },
  name: { type: String, required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  offerstatus: { type: Boolean, required: true },
  location: { type: String },
  jobtype: { type: String },
  rounds: { type: Number },
  content: [{ type: String }],
  yearsofexperience: { type: Number },
  companylogo:{type:String}
});
const CreateInterview = mongoose.model("interview", InterviewSchema);
module.exports = CreateInterview;
