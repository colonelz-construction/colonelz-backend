import mongoose from "mongoose";

const orgSchema = new mongoose.Schema({


    org_phone: {
        type: Number,
        // required: true,
    },

    org_email: {
        type: String,
        // required: true,
    },
    email: {
        type: String,
        // required: true,
    },
    currency: {
        type: String,
        // required: true,
    },

    vat_tax_gst_number: [
       
    ],

    org_website: {
        type: String,
        // required: true,
    },
    org_address: {
        type: String,
        // required: true,
    },
    org_city: {
        type: String,
        // required: true,
    },
    org_state: {
        type: String,
        // required: true,
    },
    org_country: {
        type: String,
        // required: true,
    },
    org_zipcode: {
        type: String,
        // required: true,
    },
    org_status: {
        type: Boolean,
        required: true,
    },
    organization: {
        type: String,
        required: true,
    },

    org_logo: {
        type: String,
        // required:true,
    },

    // Spreadsheet configuration for Daily LineUp (per-organization isolation)
    daily_lineup_spreadsheet_id: {
        type: String,
        // optional: if not set, backend may fall back to env GOOGLE_SHEETS_ID
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for organization lookups
orgSchema.index({ organization: 1 });
orgSchema.index({ org_status: 1 });
orgSchema.index({ createdAt: -1 });
orgSchema.index({ org_email: 1 });
orgSchema.index({ org_phone: 1 });

export default mongoose.model("organisation", orgSchema, "organisation");
