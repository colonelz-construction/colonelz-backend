import smartSheetsService from './utils/smartSheets.service.js';

async function testSmartTimelineCreation() {
    console.log('=== Testing Smart Daily Timeline Creation ===\n');
    
    try {
        // Test date and team members
        const testDate = '2025-01-30';
        const testTeamMembers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'];
        
        console.log(`Creating daily timeline for date: ${testDate}`);
        console.log(`Team members:`, testTeamMembers);
        console.log();
        
        // Initialize the smart service
        console.log('--- Initializing Smart Sheets Service ---');
        await smartSheetsService.initialize();
        console.log(`Service initialized. Using mock: ${smartSheetsService.isUsingMock()}`);
        console.log();
        
        // Test connection
        console.log('--- Testing Connection ---');
        await smartSheetsService.testConnection();
        console.log('✓ Connection successful\n');
        
        // Get existing sheets
        console.log('--- Getting Existing Sheets ---');
        const existingSheets = await smartSheetsService.getSheetTabs();
        console.log('Existing sheets:', existingSheets.map(s => s.title));
        console.log();
        
        // Create the date sheet
        console.log('--- Creating Date Sheet ---');
        const result = await smartSheetsService.createDateSheet(testDate, testTeamMembers);
        
        console.log('✓ SUCCESS: Daily timeline created successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));
        
        // Test getting the created sheet data
        console.log('\n--- Testing Sheet Data Retrieval ---');
        const sheetData = await smartSheetsService.getSheetData(testDate);
        console.log('Sheet headers:', sheetData.headers);
        console.log('Sheet data rows:', sheetData.data.length);
        
        // Test updating a cell
        console.log('\n--- Testing Cell Update ---');
        const updateResult = await smartSheetsService.updateCell(testDate, 1, 1, 'Test task for John');
        console.log('Update result:', updateResult);
        
        // Test batch update
        console.log('\n--- Testing Batch Update ---');
        const batchUpdates = [
            { row: 1, column: 2, value: 'Test task for Jane' },
            { row: 2, column: 1, value: 'Afternoon task for John' }
        ];
        const batchResult = await smartSheetsService.batchUpdateCells(testDate, batchUpdates);
        console.log('Batch update result:', batchResult);
        
        // Test duplicate creation (should fail)
        console.log('\n--- Testing Duplicate Creation (should fail) ---');
        try {
            await smartSheetsService.createDateSheet(testDate, testTeamMembers);
            console.log('✗ ERROR: Duplicate creation should have failed');
        } catch (error) {
            console.log('✓ SUCCESS: Duplicate creation properly rejected:', error.message);
        }
        
        console.log('\n=== All Tests Completed Successfully ===');
        
        if (smartSheetsService.isUsingMock()) {
            console.log('\n📝 NOTE: Tests ran using mock service.');
            console.log('   To use real Google Sheets:');
            console.log('   1. Ensure GOOGLE_SHEETS_ID is set correctly');
            console.log('   2. Verify Google Service Account credentials');
            console.log('   3. Check that the service account has access to the spreadsheet');
        }
        
    } catch (error) {
        console.log('✗ ERROR:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Run the test
testSmartTimelineCreation();