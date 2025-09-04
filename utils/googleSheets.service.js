import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

class GoogleSheetsService {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        this.initialized = false;
    }

    async initializeAuth() {
        try {
            console.log("==============================================");
            console.log("[GoogleSheets] 🚀 Starting Google Sheets auth initialization...");
            console.log("==============================================");
    
            if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                throw new Error('[GoogleSheets] ❌ GOOGLE_SERVICE_ACCOUNT_KEY is not set in environment');
            }
    
            // Decode base64 JSON
            const decodedJson = Buffer.from(
                process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
                'base64'
            ).toString('utf-8');
    
            let credentials;
            try {
                credentials = JSON.parse(decodedJson);
                console.log("[GoogleSheets] ✅ Service account JSON parsed successfully from base64 env");
            } catch (parseError) {
                throw new Error(`[GoogleSheets] ❌ Failed to parse base64 JSON: ${parseError.message}`);
            }
    
            // Validate fields
            if (!credentials.client_email || !credentials.private_key) {
                throw new Error('[GoogleSheets] ❌ Invalid service account: missing client_email or private_key');
            }
            if (!credentials.project_id) {
                throw new Error('[GoogleSheets] ❌ Invalid service account: missing project_id');
            }
    
            console.log("[GoogleSheets] 📧 Service account email:", credentials.client_email);
            console.log("[GoogleSheets] 🏷️ Project ID:", credentials.project_id);
    
            // Fix private key formatting
            let cleanPrivateKey = credentials.private_key;
            if (cleanPrivateKey && typeof cleanPrivateKey === 'string') {
                cleanPrivateKey = cleanPrivateKey
                    .replace(/\\n/g, '\n')
                    .replace(/\r\n/g, '\n')
                    .trim();
    
                console.log("[GoogleSheets] 🔐 Private key cleaned (first 50 chars):");
                console.log(cleanPrivateKey.slice(0, 50) + "...");
            }
    
            // Initialize Google Auth
            console.log("[GoogleSheets] ⏳ Building GoogleAuth client...");
            this.auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: credentials.client_email,
                    private_key: cleanPrivateKey,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
    
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    
            // Optional test
            if (this.spreadsheetId) {
                console.log("[GoogleSheets] 🔍 Testing Sheets API connection...");
                await this.testConnection();
            } else {
                console.log("[GoogleSheets] ⚠ No default GOOGLE_SHEETS_ID set; will require per-call spreadsheetId overrides");
            }
    
            this.initialized = true;
    
            console.log("==============================================");
            console.log("[GoogleSheets] ✅ SUCCESS: Google Sheets API connected successfully!");
            if (this.spreadsheetId) {
                console.log("[GoogleSheets] 📊 Spreadsheet ID:", this.spreadsheetId);
            }
            console.log("==============================================");
        } catch (error) {
            console.error("[GoogleSheets] ❌ Auth initialization failed:", error.message);
            this.auth = null;
            this.sheets = null;
            this.initialized = false;
            throw error;
        }
    }
    

    async testConnection(spreadsheetIdOverride) {
        try {
            if (!this.sheets) {
                throw new Error('[GoogleSheets] ❌ API not initialized');
            }

            const spreadsheetId = spreadsheetIdOverride || this.spreadsheetId;
            if (!spreadsheetId) {
                throw new Error('[GoogleSheets] ❌ Spreadsheet ID not provided');
            }

            const res = await this.sheets.spreadsheets.get({
                spreadsheetId,
                fields: 'properties.title'
            });

            console.log(`[GoogleSheets] ✅ Test connection OK: Spreadsheet title = "${res.data.properties.title}"`);
        } catch (error) {
            console.error("[GoogleSheets] ❌ Connection test failed:", error.message);
            throw new Error(`[GoogleSheets] ❌ Connection failed: ${error.message}`);
        }
    }

    async initialize() {
        if (!this.initialized) {
            await this.initializeAuth();
        }
        return this.initialized;
    }

    /**
     * Convert a zero-based column index to A1 notation (A, B, ..., Z, AA, AB, ...)
     */
    getA1ColumnLabel(columnIndex) {
        if (columnIndex < 0) {
            throw new Error('Column index must be non-negative');
        }
        let index = columnIndex;
        let label = '';
        while (index >= 0) {
            const remainder = index % 26;
            label = String.fromCharCode(65 + remainder) + label;
            index = Math.floor(index / 26) - 1;
        }
        return label;
    }

    /**
     * Get all sheet tabs in the spreadsheet
     */
    async getSheetTabs(spreadsheetIdOverride) {
        try {
            if (!this.initialized || !this.sheets) {
                await this.initializeAuth();
            }

            if (!this.sheets) {
                throw new Error('[GoogleSheets] ❌ API is not properly initialized');
            }

            const spreadsheetId = spreadsheetIdOverride || this.spreadsheetId;
            if (!spreadsheetId) {
                throw new Error('[GoogleSheets] ❌ Spreadsheet ID not provided');
            }

            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
            });

            if (!response.data || !response.data.sheets) {
                throw new Error('[GoogleSheets] ❌ Invalid response from Google Sheets API');
            }

            return response.data.sheets.map(sheet => ({
                title: sheet.properties.title,
                sheetId: sheet.properties.sheetId,
            }));
        } catch (error) {
            console.error('[GoogleSheets] ❌ Error getting sheet tabs:', error);
            if (error.code === 404) {
                throw new Error('[GoogleSheets] ❌ Spreadsheet not found. Please check the GOOGLE_SHEETS_ID.');
            }
            if (error.code === 403) {
                throw new Error('[GoogleSheets] ❌ Access denied. Please check Google Sheets permissions.');
            }
            throw error;
        }
    }

    /**
     * Create a new sheet tab for a specific date
     */
    async createDateSheet(date, teamMembers, spreadsheetIdOverride) {
        try {
            if (!this.initialized || !this.sheets) {
                await this.initializeAuth();
            }

            if (!this.sheets) {
                throw new Error('[GoogleSheets] ❌ API is not properly initialized');
            }

            const spreadsheetId = spreadsheetIdOverride || this.spreadsheetId;
            if (!spreadsheetId) {
                throw new Error('[GoogleSheets] ❌ Spreadsheet ID not provided');
            }

            // Validate inputs
            if (!date) {
                throw new Error('Date is required');
            }
            if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
                throw new Error('Team members array is required and must not be empty');
            }

            console.log(`[GoogleSheets] 📅 Creating date sheet for ${date} with team members:`, teamMembers);

            // Check if sheet already exists
            let existingSheets;
            try {
                existingSheets = await this.getSheetTabs(spreadsheetId);
            } catch (error) {
                throw new Error(`Failed to check existing sheets: ${error.message}`);
            }

            const sheetExists = existingSheets.some(sheet => sheet.title === date);
            if (sheetExists) {
                throw new Error(`Sheet for date ${date} already exists`);
            }

            // Create new sheet
            const addSheetRequest = {
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: date,
                                gridProperties: {
                                    rowCount: 100,
                                    columnCount: teamMembers.length + 2, // Time + members + Tasks for tomorrow
                                },
                            },
                        },
                    }],
                },
            };

            try {
                await this.sheets.spreadsheets.batchUpdate(addSheetRequest);
                console.log(`[GoogleSheets] ✅ Sheet tab created for ${date}`);
            } catch (error) {
                throw new Error(`Failed to create sheet tab: ${error.message}`);
            }

            // Initialize the sheet with headers and time slots
            try {
                await this.initializeSheetStructure(date, teamMembers, spreadsheetId);
                console.log(`[GoogleSheets] ✅ Sheet structure initialized for ${date}`);
            } catch (error) {
                throw new Error(`Failed to initialize sheet structure: ${error.message}`);
            }

            return { success: true, message: `Sheet for ${date} created successfully` };
        } catch (error) {
            console.error('[GoogleSheets] ❌ Error creating date sheet:', error);
            throw error;
        }
    }

    /**
     * Initialize sheet structure with headers and time slots
     */
    async initializeSheetStructure(sheetName, teamMembers, spreadsheetId) {
        try {
            const timeSlots = ['10:00 AM', '2:15 PM', '6:45 PM'];
            const headers = ['Time', ...teamMembers, 'Tasks For Tomorrow'];

            const data = [
                headers,
                ...timeSlots.map(time => [time, ...new Array(teamMembers.length + 1).fill('')])
            ];

            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A1:${this.getA1ColumnLabel(headers.length - 1)}${timeSlots.length + 1}`,
                valueInputOption: 'RAW',
                resource: { values: data },
            });

            await this.formatSheet(sheetName, headers.length, spreadsheetId);
        } catch (error) {
            console.error('[GoogleSheets] ❌ Error initializing sheet structure:', error);
            throw error;
        }
    }

    /**
     * Format the sheet with frozen rows/columns
     */
    async formatSheet(sheetName, columnCount, spreadsheetId) {
        try {
            const sheets = await this.getSheetTabs(spreadsheetId);
            const sheet = sheets.find(s => s.title === sheetName);
            if (!sheet) {
                throw new Error(`Sheet ${sheetName} not found`);
            }

            const requests = [
                {
                    updateSheetProperties: {
                        properties: {
                            sheetId: sheet.sheetId,
                            gridProperties: { frozenRowCount: 1, frozenColumnCount: 1 },
                        },
                        fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
                    },
                },
                {
                    repeatCell: {
                        range: {
                            sheetId: sheet.sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: 0,
                            endColumnIndex: columnCount,
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                                textFormat: { bold: true },
                                horizontalAlignment: 'CENTER',
                            },
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                    },
                },
                {
                    repeatCell: {
                        range: {
                            sheetId: sheet.sheetId,
                            startRowIndex: 1,
                            endRowIndex: 4,
                            startColumnIndex: 0,
                            endColumnIndex: 1,
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
                                textFormat: { bold: true },
                                horizontalAlignment: 'CENTER',
                            },
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                    },
                },
            ];

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: { requests },
            });
        } catch (error) {
            console.error('[GoogleSheets] ❌ Error formatting sheet:', error);
            throw error;
        }
    }

    /**
     * Get data from a specific sheet
     */
    async getSheetData(sheetName, spreadsheetIdOverride) {
        try {
            if (!this.initialized || !this.sheets) {
                await this.initializeAuth();
            }
            if (!this.sheets) {
                throw new Error('[GoogleSheets] ❌ API is not properly initialized');
            }

            const spreadsheetId = spreadsheetIdOverride || this.spreadsheetId;
            if (!spreadsheetId) {
                throw new Error('[GoogleSheets] ❌ Spreadsheet ID not provided');
            }

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A:ZZZ`,
            });

            const rows = response.data.values || [];
            if (rows.length === 0) {
                return { headers: [], data: [] };
            }

            const headers = rows[0];
            const data = rows.slice(1);
            return { headers, data };
        } catch (error) {
            console.error('[GoogleSheets] ❌ Error getting sheet data:', error);
            throw error;
        }
    }

    /**
     * Update a specific cell in the sheet
     */
    async updateCell(sheetName, row, column, value, spreadsheetIdOverride) {
        try {
            if (!this.initialized || !this.sheets) {
                await this.initializeAuth();
            }
            if (!this.sheets) {
                throw new Error('[GoogleSheets] ❌ API is not properly initialized');
            }

            const cellAddress = `${this.getA1ColumnLabel(column)}${row + 1}`;

            const spreadsheetId = spreadsheetIdOverride || this.spreadsheetId;
            if (!spreadsheetId) {
                throw new Error('[GoogleSheets] ❌ Spreadsheet ID not provided');
            }

            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!${cellAddress}`,
                valueInputOption: 'RAW',
                resource: { values: [[value]] },
            });

            return { success: true, message: 'Cell updated successfully' };
        } catch (error) {
            console.error('[GoogleSheets] ❌ Error updating cell:', error);
            throw error;
        }
    }

    /**
     * Update multiple cells in batch
     */
    async batchUpdateCells(sheetName, updates, spreadsheetIdOverride) {
        try {
            if (!this.initialized || !this.sheets) {
                await this.initializeAuth();
            }
            if (!this.sheets) {
                throw new Error('[GoogleSheets] ❌ API is not properly initialized');
            }

            const data = updates.map(update => ({
                range: `${sheetName}!${this.getA1ColumnLabel(update.column)}${update.row + 1}`,
                values: [[update.value]],
            }));

            const spreadsheetId = spreadsheetIdOverride || this.spreadsheetId;
            if (!spreadsheetId) {
                throw new Error('[GoogleSheets] ❌ Spreadsheet ID not provided');
            }

            await this.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                resource: {
                    valueInputOption: 'RAW',
                    data,
                },
            });

            return { success: true, message: 'Cells updated successfully' };
        } catch (error) {
            console.error('[GoogleSheets] ❌ Error batch updating cells:', error);
            throw error;
        }
    }

    /**
     * Check if user has permission to edit specific column
     */
    checkEditPermission(userRole, userName, columnHeader) {
        if (userRole === 'SUPERADMIN') {
            return true;
        }
        return columnHeader === userName;
    }

    /**
     * Delete a sheet tab
     */
    async deleteSheet(sheetName, spreadsheetIdOverride) {
        try {
            if (!this.initialized || !this.sheets) {
                await this.initializeAuth();
            }
            if (!this.sheets) {
                throw new Error('[GoogleSheets] ❌ API is not properly initialized');
            }
            const spreadsheetId = spreadsheetIdOverride || this.spreadsheetId;
            if (!spreadsheetId) {
                throw new Error('[GoogleSheets] ❌ Spreadsheet ID not provided');
            }

            const sheets = await this.getSheetTabs(spreadsheetId);
            const sheet = sheets.find(s => s.title === sheetName);
            if (!sheet) {
                throw new Error(`Sheet ${sheetName} not found`);
            }

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{ deleteSheet: { sheetId: sheet.sheetId } }],
                },
            });

            return { success: true, message: `Sheet ${sheetName} deleted successfully` };
        } catch (error) {
            console.error('[GoogleSheets] ❌ Error deleting sheet:', error);
            throw error;
        }
    }
}

const googleSheetsService = new GoogleSheetsService();

// Run init immediately on startup
googleSheetsService.initialize().catch(error => {
    console.error('[GoogleSheets] ❌ Failed to initialize service:', error.message);
});

export default googleSheetsService;
