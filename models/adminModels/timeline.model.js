import mongoose from "mongoose";


const Events = new mongoose.Schema({
    username: {
        type: String
    },
    role: {
        type: String
    },
    updated_date: {
        type: String
    },
    message: {
        type: String
    },
    tags: [],
    type: {
        type:String
    },

});

const timelineSchema = new mongoose.Schema({
  org_id: {
    type: String,
    required: true,
  },
  project_id: {
    type: String,
  },
  lead_id: {
    type: String,
  },

  leadEvents : [Events],

  projectEvents : [Events],
  
});

// Indexes for faster timeline queries
timelineSchema.index({ org_id: 1 });
timelineSchema.index({ project_id: 1 });
timelineSchema.index({ lead_id: 1 });
timelineSchema.index({ org_id: 1, project_id: 1 });
timelineSchema.index({ org_id: 1, lead_id: 1 });

export default mongoose.model("timeline", timelineSchema, "timeline");
