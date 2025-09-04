import googleSheetsService from './googleSheets.service.js';
import mockGoogleSheetsService from './mockSheets.service.js';

/**
 * Smart Google Sheets Service
 * Automatically falls back to mock service if Google Sheets credentials fail
 */
class SmartSheetsService {
    constructor() {
        this.activeService = null;
        this.usingMock = false;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            return this.activeService;
        }

        try {
            // Try to initialize Google Sheets service first
            console.log('Attempting to initialize Google Sheets service...');
            await googleSheetsService.initialize();
            this.activeService = googleSheetsService;
            this.usingMock = false;
            console.log('✓ Google Sheets service initialized successfully');
        } catch (error) {
            console.log('⚠ Google Sheets service failed, falling back to mock service');
            console.log('Error:', error.message);
            
            // Fall back to mock service
            this.activeService = mockGoogleSheetsService;
            this.usingMock = true;
            console.log('✓ Mock service initialized as fallback');
        }

        this.initialized = true;
        return this.activeService;
    }

    async getService() {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.activeService;
    }

    isUsingMock() {
        return this.usingMock;
    }

    // Proxy all methods to the active service
    async testConnection() {
        const service = await this.getService();
        return service.testConnection();
    }

    async getSheetTabs() {
        const service = await this.getService();
        return service.getSheetTabs();
    }

    async createDateSheet(date, teamMembers) {
        const service = await this.getService();
        const result = await service.createDateSheet(date, teamMembers);
        
        if (this.usingMock) {
            result.message += ' (using mock service - configure Google Sheets credentials for production)';
        }
        
        return result;
    }

    async getSheetData(sheetName) {
        const service = await this.getService();
        return service.getSheetData(sheetName);
    }

    async updateCell(sheetName, row, column, value) {
        const service = await this.getService();
        return service.updateCell(sheetName, row, column, value);
    }

    async batchUpdateCells(sheetName, updates) {
        const service = await this.getService();
        return service.batchUpdateCells(sheetName, updates);
    }

    async deleteSheet(sheetName) {
        const service = await this.getService();
        return service.deleteSheet(sheetName);
    }

    async getTeamMembers(orgId) {
        const service = await this.getService();
        return service.getTeamMembers(orgId);
    }

    checkEditPermission(userRole, userName, columnHeader) {
        // This method doesn't need async, so we can call it directly
        if (this.activeService) {
            return this.activeService.checkEditPermission(userRole, userName, columnHeader);
        }
        // Default fallback
        return userRole === 'SUPERADMIN' || columnHeader === userName;
    }
}

// Create and export a singleton instance
const smartSheetsService = new SmartSheetsService();
export default smartSheetsService;