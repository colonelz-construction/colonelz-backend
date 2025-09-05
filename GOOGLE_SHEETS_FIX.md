# Fix Google Sheets Authentication

## The Problem
Your current service account credentials are invalid or expired, causing "Invalid JWT Signature" errors.

## Solution: Generate New Credentials

### Option 1: Create New Service Account Key (Recommended)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select project: `colonelz-daily-lineup`

2. **Navigate to Service Accounts**
   - Go to: IAM & Admin > Service Accounts
   - Find: `colonelz-sheets-service@colonelz-daily-lineup.iam.gserviceaccount.com`

3. **Generate New Key**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select "JSON" format
   - Download the new key file

4. **Replace Credentials File**
   - Replace `colonelz-daily-lineup.json` with the new downloaded file
   - Keep the same filename

### Option 2: Create Completely New Service Account

1. **Create New Service Account**
   - Go to: IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Name: `colonelz-sheets-new`
   - Description: `Service account for daily timeline sheets`

2. **Grant Permissions**
   - Role: `Editor` (or `Google Sheets API` specific role)
   - Click "Create and Continue"

3. **Create Key**
   - Click "Create Key"
   - Select "JSON" format
   - Download the key file

4. **Update Configuration**
   - Replace `colonelz-daily-lineup.json` with new file
   - Update the service account email in your spreadsheet sharing

### Step 3: Share Spreadsheet with Service Account

1. **Open Your Google Spreadsheet**
   - Spreadsheet ID: `1F_750Z7bbINFo_8ytQflJ0RRzw0VNO5b2Ny0ManMutU`
   - URL: https://docs.google.com/spreadsheets/d/1F_750Z7bbINFo_8ytQflJ0RRzw0VNO5b2Ny0ManMutU/edit

2. **Share with Service Account**
   - Click "Share" button
   - Add the service account email (from the JSON file)
   - Give "Editor" permissions
   - Click "Send"

### Step 4: Test the Connection

```bash
# Test the connection
node test-daily-timeline.js
```

## Current Configuration

- **Spreadsheet ID**: `1F_750Z7bbINFo_8ytQflJ0RRzw0VNO5b2Ny0ManMutU`
- **Service Account**: `colonelz-sheets-service@colonelz-daily-lineup.iam.gserviceaccount.com`
- **Project**: `colonelz-daily-lineup`

## Quick Fix Commands

After getting new credentials:

```bash
# Test connection
node test-daily-timeline.js

# Create a daily timeline
curl -X POST http://localhost:3000/v1/api/admin/daily-lineup/sheet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"date": "2025-01-30"}'
```

## Troubleshooting

### If you still get authentication errors:

1. **Check service account email** in the JSON file
2. **Verify spreadsheet sharing** with the exact email
3. **Ensure Google Sheets API is enabled** in your project
4. **Check project ID** matches in credentials and console

### Common Issues:

- **Wrong project**: Make sure you're in the `colonelz-daily-lineup` project
- **API not enabled**: Enable Google Sheets API in the project
- **Wrong permissions**: Service account needs Editor access to the spreadsheet
- **Expired key**: Service account keys don't expire, but can be disabled

The Daily Timeline system is ready to work once you fix the Google Sheets authentication!