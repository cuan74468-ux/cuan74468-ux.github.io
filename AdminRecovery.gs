/**
 * One-time recovery, owner-only.
 * Add this file to the EXISTING Apps Script project bound to Linggau_AI_Studio_Portfolio_DB.
 * Set Script Property ADMIN_RESET_PASSWORD to a NEW unique password (14-200 chars).
 * If multiple admin accounts exist, set ADMIN_RESET_EMAIL to the intended account.
 * Run resetStudioAdminPassword() in the Apps Script editor, not from the website.
 * No admin password is written to source code or log output.
 */
function resetStudioAdminPassword() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('ADMIN_RESET_PASSWORD');
    if (!secret || secret.length < 14 || secret.length > 200) {
      throw Error('Set ADMIN_RESET_PASSWORD in Project Settings > Script Properties (14–200 characters).');
    }
    if (!props.getProperty('ADMIN_PEPPER')) {
      throw Error('This Apps Script project has no ADMIN_PEPPER; confirm the existing project and run setupDatabase first.');
    }
    const sh = sheet_('admin', ADMIN_HEADERS);
    const accounts = rows_('admin', ADMIN_HEADERS);
    const email = String(props.getProperty('ADMIN_RESET_EMAIL')||'').trim().toLowerCase();
    const matches = accounts.map((row,i)=>({i,email:String(row[0]).trim().toLowerCase()})).filter(row=>row.email && (!email||row.email===email));
    const index = matches.length===1?matches[0].i:-1;
    if (index < 0) throw Error('Admin account not found. No data modified.');
    const salt = Utilities.getUuid();
    const separator = String.fromCharCode(36);
    const saltedPassword = salt + String.fromCharCode(0) + secret;
    const verifier = 'hmac-sha256' + separator + salt + separator + sign_(digest_(saltedPassword));
    sh.getRange(index + 2, 2).setValue(verifier);
    SpreadsheetApp.flush();
    props.deleteProperty('ADMIN_RESET_PASSWORD');
    props.deleteProperty('ADMIN_RESET_EMAIL');
    props.deleteProperty('LOGIN_RATE');
    return {ok: true, message: 'Admin password reset. Login with your NEW password.'};
  } finally {
    lock.releaseLock();
  }
}
