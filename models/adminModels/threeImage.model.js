import mongoose from "mongoose";

const threeimageSchema = new mongoose.Schema({
  org_id: {
    type: String,
    required: true,
  },
  lead_id: {
    type: String,
  },
  project_id: {
    type: String,
  },
  user_id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
  },
  main_img_id: {
    type: String,
  },
  img_id: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    default: null,
  },
  url: {
    type: String,
    default: null,
  },
  crd: {
    type: [],
  },
  hp: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for threeimage lookups
threeimageSchema.index({ org_id: 1 });
threeimageSchema.index({ user_id: 1 });
threeimageSchema.index({ lead_id: 1 });
threeimageSchema.index({ project_id: 1 });
threeimageSchema.index({ type: 1 });
threeimageSchema.index({ createdAt: -1 });
threeimageSchema.index({ org_id: 1, type: 1, createdAt: -1 });

export default mongoose.model("threeimage", threeimageSchema, "threeimage");
