const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  regNo: { type: String, required: true, unique: true },
  avatar: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
