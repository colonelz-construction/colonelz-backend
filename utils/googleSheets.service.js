// import { google } from 'googleapis';
// import dotenv from 'dotenv';
// import fs from 'fs';
// import path from 'path';

// dotenv.config();

// class GoogleSheetsService {
//     constructor() {
//         this.auth = null;
//         this.sheets = null;
//         this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
//         this.initialized = false;
//     }

//     async initializeAuth() {
//         try {
//             const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

//             if (!serviceAccountKey) {
//                 throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
//             }

//             if (!this.spreadsheetId) {
//                 throw new Error('GOOGLE_SHEETS_ID environment variable is not set');
//             }

//             let credentials;

//             // Check if it's a file path or inline JSON
//             if (serviceAccountKey.startsWith('./') || serviceAccountKey.startsWith('/') || serviceAccountKey.includes('.json')) {
//                 // It's a file path - read the file
//                 const credentialsPath = path.resolve(serviceAccountKey);
//                 console.log('Reading Google Service Account credentials from file:', credentialsPath);

//                 if (!fs.existsSync(credentialsPath)) {
//                     throw new Error(`Google Service Account file not found: ${credentialsPath}`);
//                 }

//                 try {
//                     const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
//                     credentials = JSON.parse(credentialsFile);
//                     console.log('Credentials parsed successfully first: ', credentials);
//                 } catch (parseError) {
//                     throw new Error(`Failed to parse Google Service Account file: ${parseError.message}`);
//                 }
//             } else {
//                 // It's inline JSON - parse directly
//                 console.log('Using inline Google Service Account credentials');
//                 try {
//                     credentials = JSON.parse(serviceAccountKey);
//                     console.log('Credentials parsed successfully: ', credentials);
//                 } catch (parseError) {
//                     throw new Error(`Failed to parse inline Google Service Account credentials: ${parseError.message}`);
//                 }
//             }

//             // Validate required fields
//             if (!credentials.client_email || !credentials.private_key) {
//                 throw new Error('Invalid Google Service Account credentials: missing client_email or private_key');
//             }

//             if (!credentials.project_id) {
//                 throw new Error('Invalid Google Service Account credentials: missing project_id');
//             }

//             // Fix private key formatting if needed
//             if (credentials.private_key && typeof credentials.private_key === 'string') {
//                 credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
//             }

//             console.log('Initializing Google Sheets API with service account:', credentials.client_email);

//             this.auth = new google.auth.GoogleAuth({
//                 credentials,
//                 scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//             });

//             this.sheets = google.sheets({ version: 'v4', auth: this.auth });

//             // Test the connection
//             await this.testConnection();

//             this.initialized = true;
//             console.log('Google Sheets API initialized successfully');
//         } catch (error) {
//             console.error('Error initializing Google Sheets auth:', error);
//             this.auth = null;
//             this.sheets = null;
//             this.initialized = false;
//             throw error;
//         }
//     }

//     /**
//      * Test the Google Sheets connection
//      */
//     async testConnection() {
//         try {
//             if (!this.sheets) {
//                 throw new Error('Google Sheets API not initialized');
//             }

//             // Try to get spreadsheet metadata to test connection
//             await this.sheets.spreadsheets.get({
//                 spreadsheetId: this.spreadsheetId,
//                 fields: 'properties.title'
//             });

//             console.log('Google Sheets connection test successful');
//         } catch (error) {
//             console.error('Google Sheets connection test failed:', error);
//             throw new Error(`Google Sheets connection failed: ${error.message}`);
//         }
//     }

//     /**
//      * Get all sheet tabs in the spreadsheet
//      */
//     async getSheetTabs() {
//         try {
//             // Ensure Google Sheets is initialized
//             if (!this.initialized || !this.sheets) {
//                 await this.initializeAuth();
//             }

//             if (!this.sheets) {
//                 throw new Error('Google Sheets API is not properly initialized');
//             }

//             const response = await this.sheets.spreadsheets.get({
//                 spreadsheetId: this.spreadsheetId,
//             });

//             if (!response.data || !response.data.sheets) {
//                 throw new Error('Invalid response from Google Sheets API');
//             }

//             return response.data.sheets.map(sheet => ({
//                 title: sheet.properties.title,
//                 sheetId: sheet.properties.sheetId,
//             }));
//         } catch (error) {
//             console.error('Error getting sheet tabs:', error);
//             if (error.code === 404) {
//                 throw new Error('Spreadsheet not found. Please check the GOOGLE_SHEETS_ID.');
//             }
//             if (error.code === 403) {
//                 throw new Error('Access denied. Please check Google Sheets permissions.');
//             }
//             throw error;
//         }
//     }

//     /**
//      * Create a new sheet tab for a specific date
//      */
//     async createDateSheet(date, teamMembers) {
//         try {
//             // Ensure Google Sheets is initialized
//             if (!this.initialized || !this.sheets) {
//                 await this.initializeAuth();
//             }

//             if (!this.sheets) {
//                 throw new Error('Google Sheets API is not properly initialized');
//             }

//             // Validate inputs
//             if (!date) {
//                 throw new Error('Date is required');
//             }

//             if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
//                 throw new Error('Team members array is required and must not be empty');
//             }

//             console.log(`Creating date sheet for ${date} with team members:`, teamMembers);

//             // Check if sheet already exists
//             let existingSheets;
//             try {
//                 existingSheets = await this.getSheetTabs();
//             } catch (error) {
//                 throw new Error(`Failed to check existing sheets: ${error.message}`);
//             }

//             const sheetExists = existingSheets.some(sheet => sheet.title === date);

//             if (sheetExists) {
//                 throw new Error(`Sheet for date ${date} already exists`);
//             }

//             // Create new sheet
//             const addSheetRequest = {
//                 spreadsheetId: this.spreadsheetId,
//                 resource: {
//                     requests: [{
//                         addSheet: {
//                             properties: {
//                                 title: date,
//                                 gridProperties: {
//                                     rowCount: 100,
//                                     columnCount: teamMembers.length + 2, // +2 for time column and tasks for tomorrow
//                                 },
//                             },
//                         },
//                     }],
//                 },
//             };

//             try {
//                 await this.sheets.spreadsheets.batchUpdate(addSheetRequest);
//                 console.log(`Sheet tab created for ${date}`);
//             } catch (error) {
//                 throw new Error(`Failed to create sheet tab: ${error.message}`);
//             }

//             // Initialize the sheet with headers and time slots
//             try {
//                 await this.initializeSheetStructure(date, teamMembers);
//                 console.log(`Sheet structure initialized for ${date}`);
//             } catch (error) {
//                 throw new Error(`Failed to initialize sheet structure: ${error.message}`);
//             }

//             return { success: true, message: `Sheet for ${date} created successfully` };
//         } catch (error) {
//             console.error('Error creating date sheet:', error);
//             throw error;
//         }
//     }

//     /**
//      * Initialize sheet structure with headers and time slots
//      */
//     async initializeSheetStructure(sheetName, teamMembers) {
//         try {
//             // Define time slots
//             const timeSlots = ['10:00 AM', '2:15 PM', '6:45 PM'];

//             // Prepare headers: Time, Team Members, Tasks For Tomorrow
//             const headers = ['Time', ...teamMembers, 'Tasks For Tomorrow'];

//             // Prepare data with time slots
//             const data = [
//                 headers,
//                 ...timeSlots.map(time => [time, ...new Array(teamMembers.length + 1).fill('')])
//             ];

//             // Write data to sheet
//             await this.sheets.spreadsheets.values.update({
//                 spreadsheetId: this.spreadsheetId,
//                 range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}${timeSlots.length + 1}`,
//                 valueInputOption: 'RAW',
//                 resource: {
//                     values: data,
//                 },
//             });

//             // Format the sheet (freeze first row and first column)
//             await this.formatSheet(sheetName, headers.length);

//         } catch (error) {
//             console.error('Error initializing sheet structure:', error);
//             throw error;
//         }
//     }

//     /**
//      * Format the sheet with frozen rows/columns
//      */
//     async formatSheet(sheetName, columnCount) {
//         try {
//             // Get sheet ID
//             const sheets = await this.getSheetTabs();
//             const sheet = sheets.find(s => s.title === sheetName);

//             if (!sheet) {
//                 throw new Error(`Sheet ${sheetName} not found`);
//             }

//             const requests = [
//                 // Freeze first row and first column
//                 {
//                     updateSheetProperties: {
//                         properties: {
//                             sheetId: sheet.sheetId,
//                             gridProperties: {
//                                 frozenRowCount: 1,
//                                 frozenColumnCount: 1,
//                             },
//                         },
//                         fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
//                     },
//                 },
//                 // Format header row
//                 {
//                     repeatCell: {
//                         range: {
//                             sheetId: sheet.sheetId,
//                             startRowIndex: 0,
//                             endRowIndex: 1,
//                             startColumnIndex: 0,
//                             endColumnIndex: columnCount,
//                         },
//                         cell: {
//                             userEnteredFormat: {
//                                 backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
//                                 textFormat: { bold: true },
//                                 horizontalAlignment: 'CENTER',
//                             },
//                         },
//                         fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
//                     },
//                 },
//                 // Format time column
//                 {
//                     repeatCell: {
//                         range: {
//                             sheetId: sheet.sheetId,
//                             startRowIndex: 1,
//                             endRowIndex: 4, // 3 time slots + 1
//                             startColumnIndex: 0,
//                             endColumnIndex: 1,
//                         },
//                         cell: {
//                             userEnteredFormat: {
//                                 backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
//                                 textFormat: { bold: true },
//                                 horizontalAlignment: 'CENTER',
//                             },
//                         },
//                         fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
//                     },
//                 },
//             ];

//             await this.sheets.spreadsheets.batchUpdate({
//                 spreadsheetId: this.spreadsheetId,
//                 resource: { requests },
//             });

//         } catch (error) {
//             console.error('Error formatting sheet:', error);
//             throw error;
//         }
//     }

//     /**
//      * Get data from a specific sheet
//      */
//     async getSheetData(sheetName) {
//         try {
//             // Ensure Google Sheets is initialized
//             if (!this.initialized || !this.sheets) {
//                 await this.initializeAuth();
//             }

//             if (!this.sheets) {
//                 throw new Error('Google Sheets API is not properly initialized');
//             }

//             const response = await this.sheets.spreadsheets.values.get({
//                 spreadsheetId: this.spreadsheetId,
//                 range: `${sheetName}!A:Z`, // Get all data
//             });

//             const rows = response.data.values || [];
//             if (rows.length === 0) {
//                 return { headers: [], data: [] };
//             }

//             const headers = rows[0];
//             const data = rows.slice(1);

//             return { headers, data };
//         } catch (error) {
//             console.error('Error getting sheet data:', error);
//             throw error;
//         }
//     }

//     /**
//      * Update a specific cell in the sheet
//      */
//     async updateCell(sheetName, row, column, value) {
//         try {
//             // Ensure Google Sheets is initialized
//             if (!this.initialized || !this.sheets) {
//                 await this.initializeAuth();
//             }

//             if (!this.sheets) {
//                 throw new Error('Google Sheets API is not properly initialized');
//             }

//             const cellAddress = `${String.fromCharCode(65 + column)}${row + 1}`;

//             await this.sheets.spreadsheets.values.update({
//                 spreadsheetId: this.spreadsheetId,
//                 range: `${sheetName}!${cellAddress}`,
//                 valueInputOption: 'RAW',
//                 resource: {
//                     values: [[value]],
//                 },
//             });

//             return { success: true, message: 'Cell updated successfully' };
//         } catch (error) {
//             console.error('Error updating cell:', error);
//             throw error;
//         }
//     }

//     /**
//      * Update multiple cells in batch
//      */
//     async batchUpdateCells(sheetName, updates) {
//         try {
//             // Ensure Google Sheets is initialized
//             if (!this.initialized || !this.sheets) {
//                 await this.initializeAuth();
//             }

//             if (!this.sheets) {
//                 throw new Error('Google Sheets API is not properly initialized');
//             }

//             const data = updates.map(update => ({
//                 range: `${sheetName}!${String.fromCharCode(65 + update.column)}${update.row + 1}`,
//                 values: [[update.value]],
//             }));

//             await this.sheets.spreadsheets.values.batchUpdate({
//                 spreadsheetId: this.spreadsheetId,
//                 resource: {
//                     valueInputOption: 'RAW',
//                     data,
//                 },
//             });

//             return { success: true, message: 'Cells updated successfully' };
//         } catch (error) {
//             console.error('Error batch updating cells:', error);
//             throw error;
//         }
//     }

//     /**
//      * Get team members from organization
//      */
//     async getTeamMembers(orgId) {
//         try {
//             if (!orgId) {
//                 throw new Error('Organization ID is required');
//             }

//             // Import your user model here and fetch active users for the organization
//             // This is a placeholder implementation - replace with actual database query
//             const registerModel = (await import('../models/usersModels/register.model.js')).default;

//             const users = await registerModel.find({ 
//                 organization: orgId, 
//                 status: true 
//             }).select('username');

//             if (!users || users.length === 0) {
//                 console.log(`No active users found for organization: ${orgId}`);
//                 return [];
//             }

//             const usernames = users.map(user => user.username).filter(username => username && username.trim());
//             console.log(`Found ${usernames.length} team members for organization ${orgId}:`, usernames);

//             return usernames;
//         } catch (error) {
//             console.error('Error getting team members:', error);
//             throw error;
//         }
//     }

//     /**
//      * Check if user has permission to edit specific column
//      */
//     checkEditPermission(userRole, userName, columnHeader) {
//         // Superadmins can edit all columns
//         if (userRole === 'SUPERADMIN') {
//             return true;
//         }

//         // Other users can only edit their own column
//         return columnHeader === userName;
//     }

//     /**
//      * Delete a sheet tab
//      */
//     async deleteSheet(sheetName) {
//         try {
//             // Ensure Google Sheets is initialized
//             if (!this.initialized || !this.sheets) {
//                 await this.initializeAuth();
//             }

//             if (!this.sheets) {
//                 throw new Error('Google Sheets API is not properly initialized');
//             }

//             const sheets = await this.getSheetTabs();
//             const sheet = sheets.find(s => s.title === sheetName);

//             if (!sheet) {
//                 throw new Error(`Sheet ${sheetName} not found`);
//             }

//             await this.sheets.spreadsheets.batchUpdate({
//                 spreadsheetId: this.spreadsheetId,
//                 resource: {
//                     requests: [{
//                         deleteSheet: {
//                             sheetId: sheet.sheetId,
//                         },
//                     }],
//                 },
//             });

//             return { success: true, message: `Sheet ${sheetName} deleted successfully` };
//         } catch (error) {
//             console.error('Error deleting sheet:', error);
//             throw error;
//         }
//     }

//     /**
//      * Initialize the service - call this before using any methods
//      */
//     async initialize() {
//         if (!this.initialized) {
//             await this.initializeAuth();
//         }
//         return this.initialized;
//     }
// }

// // Create and export a singleton instance
// const googleSheetsService = new GoogleSheetsService();

// // Initialize the service immediately
// googleSheetsService.initialize().catch(error => {
//     console.error('Failed to initialize Google Sheets service:', error.message);
// });

// export default googleSheetsService;


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

            const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

            if (!serviceAccountKey) {
                throw new Error('[GoogleSheets] ❌ GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
            }

            if (!this.spreadsheetId) {
                throw new Error('[GoogleSheets] ❌ GOOGLE_SHEETS_ID environment variable is not set');
            }

            let credentials;

            // File path vs inline JSON
            if (serviceAccountKey.startsWith('./') || serviceAccountKey.startsWith('/') || serviceAccountKey.includes('.json')) {
                const credentialsPath = path.resolve(serviceAccountKey);
                console.log("[GoogleSheets] 📂 Reading service account JSON from file:", credentialsPath);

                if (!fs.existsSync(credentialsPath)) {
                    throw new Error(`[GoogleSheets] ❌ Service Account file not found: ${credentialsPath}`);
                }

                try {
                    const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
                    credentials = JSON.parse(credentialsFile);
                    console.log("[GoogleSheets] ✅ Service account file parsed successfully");
                } catch (parseError) {
                    throw new Error(`[GoogleSheets] ❌ Failed to parse service account JSON: ${parseError.message}`);
                }
            } else {
                console.log("[GoogleSheets] 🔑 Using inline service account credentials from env");
                try {
                    credentials = JSON.parse(serviceAccountKey);
                    console.log("[GoogleSheets] ✅ Inline service account parsed successfully");
                } catch (parseError) {
                    throw new Error(`[GoogleSheets] ❌ Failed to parse inline service account credentials: ${parseError.message}`);
                }
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

                console.log("[GoogleSheets] 🔐 Private key cleaned successfully (showing first 50 chars):");
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

            console.log("[GoogleSheets] 🔍 Testing Sheets API connection...");
            await this.testConnection();

            this.initialized = true;

            console.log("==============================================");
            console.log("[GoogleSheets] ✅ SUCCESS: Google Sheets API connected successfully!");
            console.log("[GoogleSheets] 📊 Spreadsheet ID:", this.spreadsheetId);
            console.log("==============================================");
        } catch (error) {
            console.error("[GoogleSheets] ❌ Auth initialization failed:", error.message);
            this.auth = null;
            this.sheets = null;
            this.initialized = false;
            throw error;
        }
    }

    async testConnection() {
        try {
            if (!this.sheets) {
                throw new Error('[GoogleSheets] ❌ API not initialized');
            }

            const res = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
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
}

const googleSheetsService = new GoogleSheetsService();

// Run init immediately on startup
googleSheetsService.initialize().catch(error => {
    console.error('[GoogleSheets] ❌ Failed to initialize service:', error.message);
});

export default googleSheetsService;
