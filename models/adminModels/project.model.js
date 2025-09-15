import mongoose from "mongoose";


const quotationSchema = new mongoose.Schema({
  admin_status:String,
  client_status:String,
  itemId: String,
  file_name: String,
  files: [],
  remark: String,
  client_remark:String,
  
});

const projectSchema = new mongoose.Schema({
  project_name: {
    type: String,
    required: true,
  },
  client: [],
  project_id: {
    type: String,
    required: true,
    index: true,
  },
  lead_id: {
    type: String,
  },
  org_id:{
    type: String,
    require:true,
    index: true,
  },
  project_type: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    // required: true,
  },
  mom: [],
  quotation: [quotationSchema],
  leadmanager: {
    type: String,
    require: true,
  },
  designer: {
    type: String,
    require: true,
  },
  visualizer: {
    type: String,
    require: true,
  },
  project_status: {
    type: String,
    require: true,
  },
  status: {
    type: String,
    required: true,
    default: "Active",
    enum: ["Active", "Inactive"]
  },
  project_start_date: {
    type: Date,
    require: true,
  },
  timeline_date: {
    type: Date,
    require: true,
  },
  project_end_date: {
    type: Date,
    require: true,
  },
  project_budget: {
    type: String,
    require: true,
  },
  project_location: {
    type: String,
    require: true,
  },
  project_updated_by:[],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes to optimize project lookups
projectSchema.index({ org_id: 1 });
projectSchema.index({ project_id: 1 });
projectSchema.index({ lead_id: 1 });
projectSchema.index({ project_status: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ project_start_date: 1 });
projectSchema.index({ project_end_date: 1 });
projectSchema.index({ org_id: 1, status: 1 });
projectSchema.index({ org_id: 1, project_status: 1 });

export default mongoose.model("project", projectSchema, "project");
