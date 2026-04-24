# Media Box Backend Setup

This Apps Script backend is now aligned with the current intake form and can:

- receive every form submission as JSON
- append structured data into Google Sheets with clear headings
- generate a PDF copy of the submission
- email that PDF to a configured address

## 1. Configure `Code.gs`

Open [`apps-script/Code.gs`](./Code.gs) and replace:

- `PASTE_YOUR_GOOGLE_SHEET_ID_HERE`
- `PASTE_YOUR_DRIVE_FOLDER_ID_HERE`
- `ADD_EMAIL_LATER@example.com`

Also update `companyName` if needed.

## 2. Create the spreadsheet

Create a Google Sheet and copy the spreadsheet ID from the URL.

The script will automatically create the sheet tab if it does not already exist, and it will insert the correct headers on the first submission.

## 3. Create the PDF folder

Create a Google Drive folder for PDF copies and copy the folder ID from the URL.

Each submission will generate one PDF file in that folder.

## 4. Deploy the Apps Script

1. Open [script.new](https://script.new)
2. Replace the default file with the contents of [`apps-script/Code.gs`](./Code.gs)
3. Save the project
4. Click `Deploy` -> `New deployment`
5. Select `Web app`
6. Set access to `Anyone`
7. Deploy and copy the web app URL

## 5. Connect the frontend

Open the root [`script.js`](../script.js) and set:

```js
submissionEndpoint: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
```

After that, each submission can:

- show the summary on screen
- write structured data to Google Sheets
- generate a Drive PDF
- email the PDF to the configured inbox

## What the backend now supports

The backend is updated for the current form, including:

- Social Media
- New Creative with repeatable speaker cards
- Post-Event
- External or Partner Event
- PR uploads
- Achievement uploads
- Daily Digest dedicated fields

It also stores the raw payload JSON in the sheet for reference.

## Important note

The frontend already collects uploads as structured metadata in the JSON payload. This backend records the uploaded file names in the sheet/PDF/email output, but it does not yet upload those files into Google Drive as separate stored assets.
