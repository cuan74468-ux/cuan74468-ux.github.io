const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const editor=fs.readFileSync(path.join(root,'js/cms-editor.js'),'utf8');
const cms=fs.readFileSync(path.join(root,'js/cms.js'),'utf8');
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
// Regression: editor must resolve controls before moving them to a detached section.
const lookup=editor.indexOf("const logout=panel.querySelector('#logoutAdmin')");
const detach=editor.indexOf('[actions,projectList,projectForm].forEach');
assert(lookup>=0&&detach>lookup,'Logout/control lookup must precede removal from document');
assert(editor.includes('if(!actions||!projectList||!projectForm||!logout)'), 'Incomplete CMS DOM must fail safely');
assert(editor.includes('panel.prepend(bar);panel.append(projectArea)'), 'Project editor must be reattached');
// Regression: login must not be discarded merely because a subsequent data fetch failed.
assert(cms.includes('authenticated=true;'), 'Authenticated session must be tracked separately');
assert(cms.includes('if(!authenticated)clearSession()'), 'Successful login must survive content sync failure');
assert(cms.includes('form?.reset()'), 'Missing form must not crash logout/login error handling');
// Cache-bust both scripts so live browsers pick up the repair.
assert(page.includes('js/cms.js?v=20261112-auth-dom-fix'));
assert(page.includes('js/cms-editor.js?v=20261112-auth-dom-fix'));
console.log('PASS: CMS DOM lifecycle and login recovery regression guards');
