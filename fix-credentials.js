import fs from 'fs';
import path from 'path';

// Read the current credentials
const credentialsPath = path.resolve('./colonelz-daily-lineup.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Fix the private key formatting
if (credentials.private_key) {
    // Ensure proper newline formatting
    credentials.private_key = credentials.private_key
        .replace(/\\n/g, '\n')
        .replace(/\n\n+/g, '\n');
    
    console.log('Fixed private key formatting');
}

// Write back the fixed credentials
fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
console.log('Credentials file updated with proper formatting');

// Test the credentials format
console.log('Service account email:', credentials.client_email);
console.log('Project ID:', credentials.project_id);
console.log('Private key starts with:', credentials.private_key.substring(0, 50) + '...');
console.log('Private key ends with:', '...' + credentials.private_key.substring(credentials.private_key.length - 50));