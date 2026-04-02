import { google } from 'googleapis';

/**
 * Append a form response as a new row in a Google Sheet.
 *
 * @param {string} refreshToken  - The form owner's Google OAuth refresh token
 * @param {string} spreadsheetId - Target spreadsheet ID
 * @param {string} sheetName     - Target sheet/tab name (default: 'Responses')
 * @param {Array}  formFields    - Array of form field objects { label }
 * @param {Array}  responseData  - Array of response objects { fieldLabel, value }
 * @param {string} submittedAt   - ISO timestamp
 */
export async function appendResponseToSheet(
  refreshToken,
  spreadsheetId,
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

  // ── 1. Check if header row exists ──────────────────────────────────────────
  let existingValues = [];
  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    existingValues = headerRes.data.values ? headerRes.data.values[0] : [];
  } catch (_) {
    // Sheet might not have any data yet — that's fine
  }

  // Build header from form field labels + Submitted At
  const headerRow = [...formFields.map(f => f.label), 'Submitted At'];

  // If no headers yet, write the header row first
  if (!existingValues || existingValues.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headerRow] },
    });
  }

  // ── 2. Build data row matching header order ─────────────────────────────────
  const dataRow = formFields.map(field => {
    const found = responseData.find(r => r.fieldLabel === field.label || r.fieldId === field.id);
    if (!found) return '';
    return Array.isArray(found.value) ? found.value.join(', ') : String(found.value ?? '');
  });
  dataRow.push(submittedAt || new Date().toISOString());

  // ── 3. Append row ───────────────────────────────────────────────────────────
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [dataRow] },
  });

  console.log(`✅ Sheets: Appended row to sheet "${sheetName}" in ${spreadsheetId}`);
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
