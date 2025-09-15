import  mongoose from"mongoose";



const fileuploadSchema = new mongoose.Schema({
  type:{
    type: String,
    // require:true,
  },
  org_id:{
    type:String,
    require:true,
  },
  lead_id: {
    type: String,
    default: null,
  },
  lead_name: {
    type: String,
    default: null,
  },
  files: [],

  project_id: {
    type: String,
    default: null,
  },
  project_name: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// Indexes for file uploads
fileuploadSchema.index({ org_id: 1 });
fileuploadSchema.index({ type: 1 });
fileuploadSchema.index({ lead_id: 1 });
fileuploadSchema.index({ project_id: 1 });
fileuploadSchema.index({ createdAt: -1 });
fileuploadSchema.index({ org_id: 1, type: 1, createdAt: -1 });
export default mongoose.model("file", fileuploadSchema, "file");


