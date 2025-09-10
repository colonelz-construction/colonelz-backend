import mongoose from "mongoose";

const files = new mongoose.Schema({
    file_id: { type: String, required: true },
    file_name: { type: String, required: true },
    file_url: { type: String, required: true },
    status: {type: String},
    users: [],
});

const approvalSchema = new mongoose.Schema({
    lead_id: {
        type: String,
        required: true,
    },
    org_id: 
    { type: String,
     required: true,
    },

    files: [files],

    createdAt: {
        type: Date,
        default: Date.now,
    },
});
// Indexes for approvals
approvalSchema.index({ org_id: 1 });
approvalSchema.index({ lead_id: 1 });
approvalSchema.index({ createdAt: -1 });
approvalSchema.index({ org_id: 1, lead_id: 1 });
export default mongoose.model("approval", approvalSchema, "approval");
