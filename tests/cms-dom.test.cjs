const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const publicHtml=read('index.html'),adminHtml=read('studio-admin.html');
const publicCMS=read('js/cms.js'),adminJS=read('js/admin-workspace.js'),editor=read('js/cms-editor.js'),schema=read('js/studio-schema.js'),renderer=read('js/site-content.js');
assert(publicHtml.includes('js/studio-schema.js'),'Public page must load shared schema');
assert(publicHtml.includes('js/site-content.js'),'Public page must retain safe renderer');
assert(!publicHtml.includes('src="js/cms-editor.js"'),'Old popup editor must not run on public page');
assert(publicCMS.includes("window.location.assign('studio-admin.html')"),'Old CMS entry must route to workspace');
for(const id of ['loginScreen','workspace','sideNav','view-overview','view-pages','view-projects','view-leads','view-media','view-history','view-settings','detailDrawer','pagePreview']){
 assert(adminHtml.includes('id="'+id+'"'),'Workspace element missing: '+id);
}
assert(adminHtml.includes('name="password"')&&adminHtml.includes('type="password"'),'Login input must mask password');
assert(adminHtml.includes('name="robots" content="noindex,nofollow,noarchive"'),'Admin page should not be indexed');
assert(adminJS.includes("credentials:'omit'"),'Do not forward browser cookies');
assert(adminJS.includes("token:state.token"),'Workspace mutations must include authenticated token');
assert(adminJS.includes("async function loadLeads()"),'Inbox must load with pagination');
assert(adminJS.includes("function drawPager("),'Lists must support pagination');
assert(adminJS.includes("async function saveSite()"),'Site publication required');
assert(adminJS.includes("async function restoreHistory("),'History restore required');
assert(adminJS.includes("async function archiveProject("),'Archiving required');
assert(schema.includes('window.STUDIO_SCHEMA'),'Editor needs shared field definitions');
assert(renderer.includes('window.STUDIO_SCHEMA'),'Public renderer must use the shared field schema');
// Preserve a guard for the retired editor source while old popup code remains in the repository.
assert(editor.indexOf("const logout=panel.querySelector('#logoutAdmin')")<editor.indexOf('[actions,projectList,projectForm].forEach'));
console.log('PASS: standalone workspace navigation, authenticated client operations, shared schema, and legacy fallback');
