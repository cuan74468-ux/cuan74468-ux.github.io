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
const vm=require('node:vm');
const scope={window:{}};vm.runInNewContext(schema,scope);
const fields=scope.window.STUDIO_SCHEMA,keys=fields.map(f=>f.key);
assert(fields.length>=95,'All public sections need a comprehensive editable field map');
assert.equal(new Set(keys).size,keys.length,'Each field key must be unique');
for(const key of ['hero.headline2','hero.ctaUrl','about.bio1','process.step1Title','skills.chip1','skills.color1','contact.tile1Icon','form.needOption1','footer.copyright','character.image','seo.ogImage','theme.headingFont']){
 assert(keys.includes(key),'Required editable public element: '+key);
}
assert(adminJS.includes("workspaceArchiveProject"),'Archive CRUD must call protected backend action');
assert(adminJS.includes("workspaceSaveLead"),'Inbox status updates must call protected backend action');
assert(adminJS.includes("workspaceRestoreProject"),'Archived projects must be restorable');


// V4 CRUD UI contract: every interactive feature must be mounted as a real script.
const mediaJS=read('js/media-manager.js'),contentJS=read('js/content-manager.js'),publicBlocksJS=read('js/public-blocks.js');
for(const id of ['mediaGrid','mediaUsedGrid','mediaPager','mediaSearch','mediaFilter','addMediaLink','uploadMedia','newContentBlock','contentSearch','contentFilter','contentBlockList','contentBlockPager']){
 assert(adminHtml.includes('id="'+id+'"'),'CMS media/content control not mounted: '+id);
}
assert(adminHtml.includes('src="js/media-manager.js'),'Media manager must load on admin page');
assert(adminHtml.includes('src="js/content-manager.js'),'Content manager must load on admin page');
assert(publicHtml.includes('id="customContent"')&&publicHtml.includes('src="js/public-blocks.js'),'Public dynamic content renderer must be mounted');
assert(mediaJS.includes("window.STUDIO_MEDIA={load,edit,upload,pick,usedMedia,replaceActive}"),'Image upload/picker and active replacement module required');
for(const op of ["mediaList","mediaUpload","mediaSave","mediaArchive","mediaRestore"])
 assert(mediaJS.includes("'"+op+"'"),'Media UI missing protected request: '+op);
for(const op of ["contentList","contentSave","contentArchive","contentRestore"])
 assert(contentJS.includes("'"+op+"'"),'Content UI missing protected request: '+op);
assert(adminJS.includes("window.STUDIO_CONTENT?.load()"),'Content CRUD must load when opening Pages editor');
assert(adminJS.includes("window.STUDIO_MEDIA?.pick"),'Page and project image fields need library integration');
assert(publicBlocksJS.includes('textContent=String(text)'),'Public dynamic content must use text-only rendering');
assert(!publicBlocksJS.includes('innerHTML='),'Do not interpolate CMS content as HTML');

const manifest=JSON.parse(read('appsscript.json'));
assert(manifest.oauthScopes.includes('https://www.googleapis.com/auth/spreadsheets'),'GAS must retain Spreadsheet scope');
assert(manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request'),'GAS needs external request scope for GitHub asset uploads');
assert(adminJS.includes("request('health')"),'Admin status should verify deployed backend health endpoint');

assert(adminHtml.includes('id="diagnoseModules"')&&adminHtml.includes('id="diagnosticResults"'),'Read-only diagnostics controls should exist');
assert(adminJS.includes("async function diagnoseModules()"),'Module diagnostics should be implemented');
assert(adminJS.includes("'workspaceLeads'")&&adminJS.includes("'mediaList'")&&adminJS.includes("'contentList'"),'Diagnostics must check advanced backend modules');

console.log('PASS: standalone workspace navigation, authenticated client operations, shared schema, and legacy fallback');
