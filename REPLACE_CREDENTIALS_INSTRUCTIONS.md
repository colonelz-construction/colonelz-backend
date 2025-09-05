# Fix Google Sheets Authentication

## Problem
Your Google Service Account credentials have expired/been revoked, causing "Invalid JWT Signature" errors.

## Solution Steps

1. **Generate New Credentials**:
   - Go to: https://console.cloud.google.com/
   - Select project: `colonelz-daily-lineup`
   - Navigate: IAM & Admin → Service Accounts
   - Find: `colonelz-sheets-service@colonelz-daily-lineup.iam.gserviceaccount.com`
   - Click service account → Keys tab → Add Key → Create new key (JSON)

2. **Replace Credentials File**:
   - Download the new JSON file
   - Replace `colonelz-daily-lineup.json` with the new file
   - Keep the same filename: `colonelz-daily-lineup.json`

3. **Test the Fix**:
   ```bash
   node test-credentials.js
   ```

4. **Verify API Works**:
   - Test your create date sheet API
   - Should now work without "Invalid JWT Signature" error

## Alternative: Quick Fix with New Credentials
If you have new credentials ready, just replace the content of `colonelz-daily-lineup.json` with the new JSON content.