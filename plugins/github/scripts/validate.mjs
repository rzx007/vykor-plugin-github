import assert from 'node:assert/strict';
import { readFile, readdir, realpath } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root=await realpath(fileURLToPath(new URL('..',import.meta.url)));
const json=async path=>JSON.parse(await readFile(join(root,path),'utf8'));
const manifest=await json('.vykor-plugin/plugin.json'),pkg=await json('package.json'),lock=await json('package-lock.json');
assert.equal(manifest.schemaVersion,1);assert.equal(manifest.id,'dev.vykor.github');assert.equal(manifest.name,'github');
assert.match(manifest.version,/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
assert.equal(manifest.version,pkg.version);assert.equal(manifest.version,lock.version);assert.equal(manifest.version,lock.packages[''].version);
assert.equal(manifest.license,'MIT');assert.equal(pkg.license,'MIT');assert.ok((await readFile(join(root,'LICENSE'),'utf8')).includes('Copyright (c) 2026 rzx007'));
assert.deepEqual(Object.keys(manifest.components),['skills']);assert.ok(!manifest.permissions||Object.keys(manifest.permissions).length===0);
const names=['setup','commit','pr','issue','release','workflow-run','secret','repo','gist','codespace'];
assert.deepEqual(manifest.components.skills,names.map(name=>`./skills/${name}/SKILL.md`));
async function local(path){const actual=await realpath(path);assert.ok(actual===root||actual.startsWith(root+sep),`Path escapes plugin: ${path}`);return actual;}
for(const name of names){
  const source=await readFile(await local(join(root,'skills',name,'SKILL.md')),'utf8');
  const front=source.match(/^---\r?\n([\s\S]*?)\r?\n---/);assert.ok(front,`Missing frontmatter: ${name}`);
  assert.ok(front[1].split(/\r?\n/).includes(`name: ${name}`));assert.match(front[1],/^description: \S.+$/m);assert.match(front[1],/^user-invocable: true$/m);
}
async function walk(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    if(['.git','node_modules','dist','coverage'].includes(entry.name))continue;
    const path=join(directory,entry.name);
    if(entry.isDirectory())await walk(path);
    else if(entry.isFile()&&entry.name.endsWith('.md')){
      const text=await readFile(path,'utf8');
      for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
        const target=match[1];if(/^(?:https?:|mailto:|#)/.test(target))continue;
        await local(resolve(dirname(path),decodeURIComponent(target.split('#')[0])));
      }
    }
  }
}
await walk(root);
const icon=await readFile(join(root,'assets/icon.svg'));assert.equal(manifest.icon,'data:image/svg+xml;base64,'+icon.toString('base64'));
assert.equal(manifest.author.name,'rzx007');assert.ok(manifest.introduction.length>100);assert.ok(manifest.prompts.length>0);
for(const prompt of manifest.prompts){assert.ok(prompt.title.trim());assert.ok(prompt.prompt.trim());}
execFileSync(process.execPath,['--check',join(root,'scripts/secrets.mjs')],{stdio:'pipe'});
console.log(`Validated ${manifest.id}@${manifest.version}: 10 Skills, local references, versions, license, icon and standalone helper.`);
