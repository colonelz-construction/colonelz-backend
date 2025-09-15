import mongoose from "mongoose";

const signUp = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
  organization: {
    type: String,
    required: true,
    index: true,
  },

  role: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    require: true,
  },
  userProfile: {
    type: String,
    // required:true,
  },
  data: [],
  access: {},
  refreshToken: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Useful indexes for user lookups
signUp.index({ organization: 1 });
signUp.index({ email: 1 });
signUp.index({ username: 1 });
signUp.index({ status: 1 });
signUp.index({ role: 1 });
signUp.index({ createdAt: -1 });
signUp.index({ organization: 1, role: 1 });

export default mongoose.model("users", signUp, "users");
