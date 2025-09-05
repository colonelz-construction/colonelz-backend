import googleSheetsService from './utils/googleSheets.service.js';

async function testDailyTimelineCreation() {
    console.log('=== Testing Daily Timeline Creation ===\n');
    
    try {
        // Test date and team members
        const testDate = '2025-01-30';
        const testTeamMembers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'];
        
        console.log(`Creating daily timeline for date: ${testDate}`);
        console.log(`Team members:`, testTeamMembers);
        console.log();
        
        // Test connection first
        console.log('--- Testing Google Sheets Connection ---');
        await googleSheetsService.testConnection();
        console.log('✓ Connection successful\n');
        
        // Get existing sheets
        console.log('--- Getting Existing Sheets ---');
        const existingSheets = await googleSheetsService.getSheetTabs();
        console.log('Existing sheets:', existingSheets.map(s => s.title));
        console.log();
        
        // Create the date sheet
        console.log('--- Creating Date Sheet ---');
        const result = await googleSheetsService.createDateSheet(testDate, testTeamMembers);
        
        console.log('✓ SUCCESS: Daily timeline created successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));
        
        // Test getting the created sheet data
        console.log('\n--- Testing Sheet Data Retrieval ---');
        const sheetData = await googleSheetsService.getSheetData(testDate);
        console.log('Sheet headers:', sheetData.headers);
        console.log('Sheet data rows:', sheetData.data.length);
        
        // Test duplicate creation (should fail)
        console.log('\n--- Testing Duplicate Creation (should fail) ---');
        try {
            await googleSheetsService.createDateSheet(testDate, testTeamMembers);
            console.log('✗ ERROR: Duplicate creation should have failed');
        } catch (error) {
            console.log('✓ SUCCESS: Duplicate creation properly rejected:', error.message);
        }
        
        console.log('\n=== All Tests Completed Successfully ===');
        
    } catch (error) {
        console.log('✗ ERROR:', error.message);
        console.log('Stack:', error.stack);
        
        // Check if it's a credentials issue
        if (error.message.includes('credentials') || error.message.includes('authentication')) {
            console.log('\n💡 HINT: Make sure your Google Service Account credentials are properly configured');
            console.log('   - Check GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
            console.log('   - Verify the service account has access to the spreadsheet');
        }
        
        if (error.message.includes('GOOGLE_SHEETS_ID')) {
            console.log('\n💡 HINT: Make sure GOOGLE_SHEETS_ID environment variable is set correctly');
        }
    }
}

// Run the test
testDailyTimelineCreation();