import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, chmod } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, delimiter, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const script=fileURLToPath(new URL('../scripts/secrets.mjs',import.meta.url));
test('installed helper help is standalone and read-only',()=>{
  const output=execFileSync(process.execPath,[script,'--help'],{encoding:'utf8'});
  assert.match(output,/preview/);assert.match(output,/expected-account/);assert.match(output,/unknown/);
});
test('invalid CLI options fail without echoing supplied sensitive values',()=>{
  const value='PRIVATE_DO_NOT_PRINT';
  const result=spawnSync(process.execPath,[script,'apply','--bad-option',value],{encoding:'utf8'});
  assert.equal(result.status,1);assert.equal(result.stdout,'');assert.ok(!result.stderr.includes(value));assert.equal(JSON.parse(result.stderr).status,'not_started');
});
test('real subprocess stderr cannot leak into an uncertain Secret receipt',{skip:process.platform==='win32'?'POSIX executable fixture; exercised by Linux CI':false},async()=>{
  const parent=resolve(tmpdir()),root=await mkdtemp(join(parent,'vykor-github-cli-'));
  try{
    const fake=join(root,'gh'),file=join(root,'.env'),value='PRIVATE_SUBPROCESS_SENTINEL';
    await writeFile(file,'KEY='+value+'\n');
    await writeFile(fake,`#!/usr/bin/env node\nconst a=process.argv.slice(2);if(a[0]==='api'){process.stdout.write(a.includes('user')?'reviewer':'owner/repo');}else{process.stderr.write('${value}');process.exitCode=1;}\n`);await chmod(fake,0o755);
    const env={...process.env,PATH:root+delimiter+process.env.PATH};
    const preview=JSON.parse(execFileSync(process.execPath,[script,'preview','--repo','owner/repo','--file',file],{env,encoding:'utf8'}));
    const result=spawnSync(process.execPath,[script,'apply','--repo','owner/repo','--file',file,'--expected-sha256',preview.sha256,'--expected-account',preview.account,'--confirm'],{env,encoding:'utf8'});
    assert.equal(result.status,2);assert.equal(result.stderr,'');assert.ok(!result.stdout.includes(value));assert.equal(JSON.parse(result.stdout).status,'unknown');
  }finally{assert.ok(root.startsWith(parent+sep+'vykor-github-cli-'));await rm(root,{recursive:true,force:true});}
});
