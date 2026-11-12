/**
 * One-time recovery, owner-only.
 * Add this file to the EXISTING Apps Script project bound to Linggau_AI_Studio_Portfolio_DB.
 * Set Script Property ADMIN_RESET_PASSWORD to a NEW unique password (14-200 chars).
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
    const email = 'peyaje531@gmail.com';
    const sh = sheet_('admin', ADMIN_HEADERS);
    const index = rows_('admin', ADMIN_HEADERS).findIndex(row =>
      String(row[0]).trim().toLowerCase() === email
    );
    if (index < 0) throw Error('Admin account not found. No data modified.');
    const salt = Utilities.getUuid();
    const separator = String.fromCharCode(36);
    const saltedPassword = salt + String.fromCharCode(0) + secret;
    const verifier = 'hmac-sha256' + separator + salt + separator + sign_(digest_(saltedPassword));
    sh.getRange(index + 2, 2).setValue(verifier);
    SpreadsheetApp.flush();
    props.deleteProperty('ADMIN_RESET_PASSWORD');
    props.deleteProperty('LOGIN_RATE');
    return {ok: true, message: 'Admin password reset. Login with your NEW password.'};
  } finally {
    lock.releaseLock();
  }
}
