import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, symlink } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { parseDotenv, previewSecrets, applySecrets } from '../scripts/secrets.mjs';

const PRIVATE = 'SECRET_SENTINEL_do_not_print';
async function fixture(run, text = `ONE=${PRIVATE}\nTWO="line\\nvalue"\n`) {
  const parent=resolve(tmpdir()), root=await mkdtemp(join(parent,'vykor-github-secret-'));
  const file=join(root,'.env');await writeFile(file,text);
  try { await run({file,root,repo:'owner/repo',hostname:'github.com'}); }
  finally { assert.ok(root.startsWith(parent+sep+'vykor-github-secret-'));await rm(root,{recursive:true,force:true}); }
}
function fakeGh(options={}) {
  const calls=[];
  const runGh=async(args,input)=>{
    calls.push({args,input});
    if(args[0]==='api')return args.includes('user')?(options.account??'reviewer'):(options.repository??'owner/repo');
    if(args[0]==='secret'&&args[1]==='set') {
      if(args[2]===options.failOn)throw Error(PRIVATE);
      return PRIVATE; // Never print raw gh stdout, even if it contains credentials.
    }
    throw Error('unexpected command');
  };
  return {runGh,calls};
}
test('parses the documented dotenv subset without evaluating shell content',()=>{
  assert.deepEqual(parseDotenv('\ufeff#comment\nexport lower="a\\nb" # hi\nSINGLE=\'literal $HOME\'\nRAW=$(no-command) # trailing\nHASH=#literal\n'),[
    {name:'LOWER',value:'a\nb'},{name:'SINGLE',value:'literal $HOME'},{name:'RAW',value:'$(no-command)'},{name:'HASH',value:'#literal'},
  ]);
});
for(const [label,text] of [['duplicate','NAME=a\nname=b'],['reserved','GITHUB_TOKEN=a'],['invalid','BAD-NAME=a'],['multiline','NAME="a\nb"'],['trailing','NAME="a" extra'],['empty','# none'],['escape','NAME="bad\\q"'],['value size','NAME='+('x'.repeat(48*1024+1))]]) {
  test(`rejects ${label} without exposing a value`,()=>{
    assert.throws(()=>parseDotenv(text),error=>!error.message.includes(PRIVATE));
  });
}
test('preview reveals only confirmed target, account, names and confirmation digest',()=>fixture(async input=>{
  const gh=fakeGh(), plan=await previewSecrets(input,gh);
  assert.deepEqual(plan.names,['ONE','TWO']);assert.equal(plan.account,'reviewer');assert.equal(plan.repository,'owner/repo');assert.match(plan.sha256,/^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(plan).includes(PRIVATE));assert.equal(gh.calls.length,2);
}));

for(const changed of [{repo:'owner/unapproved'},{hostname:'other.example'}]){
  test(`a changed ${Object.keys(changed)[0]} cannot reuse the original preview even when GitHub verifies it`,()=>fixture(async input=>{
    const plan=await previewSecrets(input,fakeGh());
    const gh=fakeGh({repository:changed.repo??input.repo});
    await assert.rejects(applySecrets({...input,...changed,confirm:true,expectedSha256:plan.sha256,expectedAccount:plan.account},gh));
    assert.equal(gh.calls.filter(call=>call.args[0]==='secret').length,0);
  }));
}
test('apply requires an explicit confirmation before any GitHub operation',()=>fixture(async input=>{
  const gh=fakeGh();await assert.rejects(applySecrets({...input,expectedSha256:'a'.repeat(64),expectedAccount:'reviewer'},gh));assert.equal(gh.calls.length,0);
}));
test('file changes invalidate the preview before any secret write',()=>fixture(async input=>{
  const gh=fakeGh(), plan=await previewSecrets(input,gh);await writeFile(input.file,'ONE=rotated');
  await assert.rejects(applySecrets({...input,confirm:true,expectedSha256:plan.sha256,expectedAccount:plan.account},gh));
  assert.equal(gh.calls.filter(call=>call.args[0]==='secret').length,0);
}));
test('account or repository changes cannot reuse the confirmation',()=>fixture(async input=>{
  const plan=await previewSecrets(input,fakeGh());
  for(const gh of [fakeGh({account:'other'}),fakeGh({repository:'other/repo'})]){
    await assert.rejects(applySecrets({...input,confirm:true,expectedSha256:plan.sha256,expectedAccount:plan.account},gh));
    assert.equal(gh.calls.filter(call=>call.args[0]==='secret').length,0);
  }
}));
test('writes values only to stdin, with explicit host/repository, and reports acknowledged names',()=>fixture(async input=>{
  const gh=fakeGh(), plan=await previewSecrets(input,gh);
  const result=await applySecrets({...input,confirm:true,expectedSha256:plan.sha256,expectedAccount:plan.account},gh);
  assert.equal(result.status,'completed');assert.deepEqual(result.completed,['ONE','TWO']);assert.ok(!JSON.stringify(result).includes(PRIVATE));
  const writes=gh.calls.filter(call=>call.args[0]==='secret');assert.equal(writes.length,2);
  assert.deepEqual(writes[0].args,['secret','set','ONE','--repo','github.com/owner/repo']);assert.equal(writes[0].input,PRIVATE);
  assert.ok(!JSON.stringify(writes.map(write=>write.args)).includes(PRIVATE));assert.equal(writes[1].input,'line\nvalue');
}));
test('an uncertain write stops the batch, retains prior acknowledgements and redacts diagnostics',()=>fixture(async input=>{
  const gh=fakeGh({failOn:'TWO'}), plan=await previewSecrets(input,gh);
  const result=await applySecrets({...input,confirm:true,expectedSha256:plan.sha256,expectedAccount:plan.account},gh);
  assert.equal(result.status,'unknown');assert.deepEqual(result.completed,['ONE']);assert.equal(result.unknown,'TWO');assert.deepEqual(result.notStarted,['THREE']);
  assert.equal(gh.calls.filter(call=>call.args[0]==='secret').length,2);assert.ok(!JSON.stringify(result).includes(PRIVATE));
},`ONE=${PRIVATE}\nTWO=private\nTHREE=not-started\n`));
for(const options of [{repo:'--bad/repo'},{repo:'owner/../repo'},{repo:'owner/repo;echo'},{hostname:'github.com/evil'},{hostname:'github.com:443'},{hostname:'user@github.com'}]) {
  test(`rejects malformed target ${Object.keys(options)[0]}`,()=>fixture(async input=>{
    const gh=fakeGh();await assert.rejects(previewSecrets({...input,...options},gh));assert.equal(gh.calls.length,0);
  }));
}
test('rejects secret-file symlinks and directories',()=>fixture(async input=>{
  const link=join(input.root,'linked.env');
  try { await symlink(input.file,link); }catch(error){ if(error.code!=='EPERM')throw error; }
  await assert.rejects(previewSecrets({...input,file:input.root},fakeGh()));
  if(process.platform!=='win32')await assert.rejects(previewSecrets({...input,file:link},fakeGh()));
}));
