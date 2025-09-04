/**
 * Mock Google Sheets Service for Development/Testing
 * Use this when Google Sheets credentials are not available
 */

class MockGoogleSheetsService {
    constructor() {
        // Map of spreadsheetId => Map of date => sheet
        this.mockSpreadsheets = new Map();
        console.log('Using Mock Google Sheets Service - for development only');
    }

    async initializeAuth() {
        console.log('Mock: Google Sheets auth initialized');
        return true;
    }

    async testConnection() {
        console.log('Mock: Google Sheets connection test successful');
        return true;
    }

    async getSheetTabs(spreadsheetIdOverride) {
        const key = spreadsheetIdOverride || 'GLOBAL';
        if (!this.mockSpreadsheets.has(key)) {
            this.mockSpreadsheets.set(key, new Map());
        }
        const sheetsMap = this.mockSpreadsheets.get(key);

        // Start with some default examples for a new spreadsheet
        if (sheetsMap.size === 0) {
            const defaults = ['2025-01-01', '2025-01-02', '2025-01-03'];
            for (const d of defaults) {
                sheetsMap.set(d, {
                    title: d,
                    sheetId: Date.now() + Math.floor(Math.random() * 1000),
                    teamMembers: ['User1', 'User2'],
                    timeSlots: ['10:00 AM', '2:15 PM', '6:45 PM'],
                    data: this.createMockSheetData(['User1', 'User2'])
                });
            }
        }

        const mockTabs = Array.from(sheetsMap.entries()).map(([date, sheet]) => ({ title: date, sheetId: sheet.sheetId }));
        console.log(`Mock: Returning sheet tabs for ${key}:`, mockTabs.map(t => t.title));
        return mockTabs;
    }

    async createDateSheet(date, teamMembers, spreadsheetIdOverride) {
        if (!date) {
            throw new Error('Date is required');
        }

        if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
            throw new Error('Team members array is required and must not be empty');
        }

        const key = spreadsheetIdOverride || 'GLOBAL';
        if (!this.mockSpreadsheets.has(key)) {
            this.mockSpreadsheets.set(key, new Map());
        }
        const sheetsMap = this.mockSpreadsheets.get(key);

        // Check if sheet already exists
        const existingSheets = await this.getSheetTabs(key);
        const sheetExists = existingSheets.some(sheet => sheet.title === date);
        
        if (sheetExists) {
            throw new Error(`Sheet for date ${date} already exists`);
        }

        // Simulate sheet creation
        const newSheet = {
            title: date,
            sheetId: Date.now(),
            teamMembers: teamMembers,
            timeSlots: ['10:00 AM', '2:15 PM', '6:45 PM'],
            data: this.createMockSheetData(teamMembers)
        };

        sheetsMap.set(date, newSheet);

        console.log(`Mock: Created sheet for ${date} with team members:`, teamMembers);
        
        return { 
            success: true, 
            message: `Mock sheet for ${date} created successfully`,
            data: newSheet
        };
    }

    createMockSheetData(teamMembers) {
        const headers = ['Time', ...teamMembers, 'Tasks For Tomorrow'];
        const timeSlots = ['10:00 AM', '2:15 PM', '6:45 PM'];
        
        const data = [
            headers,
            ...timeSlots.map(time => [time, ...new Array(teamMembers.length + 1).fill('')])
        ];

        return {
            headers,
            data: data.slice(1) // Remove headers from data
        };
    }

    async initializeSheetStructure(sheetName, teamMembers) {
        console.log(`Mock: Initialized sheet structure for ${sheetName}`);
        return true;
    }

    async formatSheet(sheetName, columnCount) {
        console.log(`Mock: Formatted sheet ${sheetName} with ${columnCount} columns`);
        return true;
    }

    async getSheetData(sheetName, spreadsheetIdOverride) {
        const key = spreadsheetIdOverride || 'GLOBAL';
        const sheetsMap = this.mockSpreadsheets.get(key) || new Map();
        const sheet = sheetsMap.get(sheetName);
        
        if (!sheet) {
            // Return default structure
            const defaultData = this.createMockSheetData(['User1', 'User2', 'User3']);
            console.log(`Mock: Returning default data for ${sheetName} in ${key}`);
            return defaultData;
        }

        console.log(`Mock: Returning data for ${sheetName} in ${key}`);
        return sheet.data;
    }

    async updateCell(sheetName, row, column, value, spreadsheetIdOverride) {
        const key = spreadsheetIdOverride || 'GLOBAL';
        console.log(`Mock: Updated cell ${sheetName}[${row}][${column}] = "${value}" in ${key}`);
        return { success: true, message: 'Mock cell updated successfully' };
    }

    async batchUpdateCells(sheetName, updates, spreadsheetIdOverride) {
        const key = spreadsheetIdOverride || 'GLOBAL';
        console.log(`Mock: Batch updated ${updates.length} cells in ${sheetName} in ${key}`);
        updates.forEach(update => {
            console.log(`  - [${update.row}][${update.column}] = "${update.value}"`);
        });
        return { success: true, message: 'Mock cells updated successfully' };
    }

    checkEditPermission(userRole, userName, columnHeader) {
        // Superadmins can edit all columns
        if (userRole === 'SUPERADMIN') {
            return true;
        }

        // Other users can only edit their own column
        return columnHeader === userName;
    }

    async deleteSheet(sheetName, spreadsheetIdOverride) {
        const key = spreadsheetIdOverride || 'GLOBAL';
        const sheetsMap = this.mockSpreadsheets.get(key) || new Map();
        const existed = sheetsMap.has(sheetName);
        sheetsMap.delete(sheetName);
        
        console.log(`Mock: ${existed ? 'Deleted' : 'Attempted to delete'} sheet ${sheetName} in ${key}`);
        
        if (!existed) {
            throw new Error(`Sheet ${sheetName} not found`);
        }

        return { success: true, message: `Mock sheet ${sheetName} deleted successfully` };
    }
}

// Create and export a singleton instance
const mockGoogleSheetsService = new MockGoogleSheetsService();
export default mockGoogleSheetsService;