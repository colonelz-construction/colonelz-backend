import mongoose from "mongoose";

const login = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    // required:true
  },

  logInDate: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // expire documents ~30 days after creation
    expires: 60 * 60 * 24 * 30,
  },
});
// Indexes for login logs
login.index({ userID: 1 });
login.index({ createdAt: -1 });
export default mongoose.model("login", login, "login");
