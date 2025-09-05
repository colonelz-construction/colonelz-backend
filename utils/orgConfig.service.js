import orgModel from "../models/orgmodels/org.model.js";
import registerModel from "../models/usersModels/register.model.js";

/**
 * Resolve the Daily LineUp spreadsheetId for a given organization or user.
 * Priority:
 * 1) Organisation.daily_lineup_spreadsheet_id
 * 2) process.env.GOOGLE_SHEETS_ID (global fallback)
 */
export async function getDailyLineUpSpreadsheetIdByOrgId(orgId) {
    if (!orgId) return process.env.GOOGLE_SHEETS_ID || null;
    const org = await orgModel.findOne({ organization: orgId }).select("daily_lineup_spreadsheet_id organization").lean();
    return org?.daily_lineup_spreadsheet_id || process.env.GOOGLE_SHEETS_ID || null;
}

export async function getDailyLineUpSpreadsheetIdByUserId(userId) {
    if (!userId) return process.env.GOOGLE_SHEETS_ID || null;
    const user = await registerModel.findById(userId).select("organization").lean();
    return getDailyLineUpSpreadsheetIdByOrgId(user?.organization);
}

export default {
    getDailyLineUpSpreadsheetIdByOrgId,
    getDailyLineUpSpreadsheetIdByUserId,
};


