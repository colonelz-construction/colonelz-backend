
import mongoose from "mongoose";

const notification = new mongoose.Schema({
  type: String, 
  itemId: String,
  org_id: String,
  notification_id: String,
  message: String, 
  status: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for notification queries
notification.index({ org_id: 1 });
notification.index({ status: 1 });
notification.index({ createdAt: -1 });
notification.index({ org_id: 1, status: 1, createdAt: -1 });

export default mongoose.model("Notification", notification);
