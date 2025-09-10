import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    role:{type: String, require:true},
    access: { type: Object, require:true },
    org_id:{ type:String, index: true, require:true},
    createdAt: { type: Date, default: Date.now },
});

// Indexes for roles
roleSchema.index({ org_id: 1 });
roleSchema.index({ role: 1 });
roleSchema.index({ org_id: 1, role: 1 }, { unique: false });

export default mongoose.model('Roles', roleSchema);


