import { google } from 'googleapis';

/**
 * Extracts the spreadsheet ID from a string, handles both raw IDs and full URLs.
 */
export function extractSpreadsheetId(idOrUrl) {
  if (!idOrUrl) return idOrUrl;
  const match = idOrUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : idOrUrl.trim();
}

/**
 * Append a form response as a new row in a Google Sheet.
 */
export async function appendResponseToSheet(
  refreshToken,
  spreadsheetIdInput,
  sheetName = 'Responses',
  formFields,
  responseData,
  submittedAt
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdInput);

  // ── 1. Resolve Sheet Name ──────────────────────────────────────────────────
  let targetSheetName = sheetName;
  
  try {
    // Attempt to verify if the specified sheet exists, if not, find the first available one
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets.some(s => s.properties.title === targetSheetName);
    
    if (!sheetExists && spreadsheet.data.sheets.length > 0) {
      // Use the first sheet title as a fallback
      targetSheetName = spreadsheet.data.sheets[0].properties.title;
      console.log(`⚠️ Specified sheet "${sheetName}" not found. Falling back to "${targetSheetName}"`);
    }
  } catch (err) {
    console.error('❌ Error fetching spreadsheet metadata:', err.message);
    // If we can't even get metadata, the spreadsheet might be inaccessible
    throw new Error('Spreadsheet not found or access denied. Please check permissions.');
  }

  // ── 2. Check if header row exists ──────────────────────────────────────────
  let existingValues = [];
  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${targetSheetName}!1:1`,
    });
    existingValues = headerRes.data.values ? headerRes.data.values[0] : [];
  } catch (_) {
    // Sheet might not have any data yet
  }

  // Build header from form field labels + Submitted At
  const headerRow = [...formFields.map(f => f.label), 'Submitted At'];

  // If no headers yet, write the header row first
  if (!existingValues || existingValues.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${targetSheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headerRow] },
    });
  }

  // ── 3. Build data row matching header order ─────────────────────────────────
  const dataRow = formFields.map(field => {
    const found = responseData.find(r => r.fieldLabel === field.label || r.fieldId === field.id);
    if (!found) return '';
    return Array.isArray(found.value) ? found.value.join(', ') : String(found.value ?? '');
  });
  dataRow.push(submittedAt || new Date().toISOString());

  // ── 4. Append row ───────────────────────────────────────────────────────────
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${targetSheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [dataRow] },
  });

  console.log(`✅ Sheets: Appended row to sheet "${targetSheetName}" in ${spreadsheetId}`);
}

/**
 * Create a new blank Google Spreadsheet and return its ID + URL.
 */
export async function createSpreadsheet(refreshToken, title = 'Form Responses') {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: 'Responses' } }],
    },
  });

  return {
    spreadsheetId: res.data.spreadsheetId,
    spreadsheetUrl: res.data.spreadsheetUrl,
    sheetName: 'Responses',
  };
}
