import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function testCredentials() {
    try {
        console.log('🔍 Testing Google Service Account credentials...');
        
        const credentialsPath = path.resolve('./colonelz-daily-lineup.json');
        console.log('📁 Reading credentials from:', credentialsPath);
        
        if (!fs.existsSync(credentialsPath)) {
            throw new Error('Credentials file not found');
        }
        
        const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
        const credentials = JSON.parse(credentialsFile);
        
        console.log('✅ Credentials file parsed successfully');
        console.log('📧 Service account email:', credentials.client_email);
        console.log('🆔 Project ID:', credentials.project_id);
        
        // Test authentication
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        
        console.log('🔐 Creating auth client...');
        const authClient = await auth.getClient();
        
        console.log('✅ Auth client created successfully');
        
        // Test with actual Google Sheets API
        const sheets = google.sheets({ version: 'v4', auth });
        
        const spreadsheetId = '1F_750Z7bbINFo_8ytQflJ0RRzw0VNO5b2Ny0ManMutU';
        console.log('📊 Testing connection to spreadsheet:', spreadsheetId);
        
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'properties.title'
        });
        
        console.log('✅ SUCCESS! Connected to spreadsheet:', response.data.properties.title);
        
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        
        if (error.message.includes('invalid_grant')) {
            console.error('🚨 This is typically caused by:');
            console.error('   1. Expired or revoked service account key');
            console.error('   2. Incorrect system clock (time sync issue)');
            console.error('   3. Corrupted private key format');
            console.error('💡 Solution: Generate new service account credentials');
        }
    }
}

testCredentials();