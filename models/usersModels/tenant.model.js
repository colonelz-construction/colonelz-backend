import mongoose from "mongoose";

const tenant = new mongoose.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
export default mongoose.model("tenant", tenant, "tenant");
