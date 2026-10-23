import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const MAX_FILE_BYTES=1024*1024, MAX_VALUE_BYTES=48*1024;
class PlanError extends Error {}
const invalidLine=line=>new PlanError(`第 ${line} 行格式无效；支持单行 KEY=VALUE，不展开变量或命令。`);

export function parseDotenv(text){
  if(Buffer.byteLength(text,'utf8')>MAX_FILE_BYTES)throw new PlanError('Secret 文件超过 1 MiB，请拆分。');
  const result=[],seen=new Set();
  for(const [index,source] of text.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/).entries()){
    if(!source.trim()||source.trimStart().startsWith('#'))continue;
    const match=source.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if(!match)throw invalidLine(index+1);
    const name=match[1].toUpperCase(),raw=match[2];
    if(name.startsWith('GITHUB_')||seen.has(name))throw new PlanError(`第 ${index+1} 行包含保留名称或大小写重复名称。`);
    let value='';
    if(raw[0]==='"'||raw[0]==="'"){
      const quote=raw[0];let closing=-1;
      for(let at=1;at<raw.length;at++){
        const char=raw[at];
        if(quote==='"'&&char==='\\'){
          const escapes={n:'\n',r:'\r',t:'\t','\\':'\\','"':'"'};
          const next=raw[++at];if(!Object.hasOwn(escapes,next))throw invalidLine(index+1);
          value+=escapes[next];
        }else if(char===quote){closing=at;break;}else value+=char;
      }
      if(closing<0)throw invalidLine(index+1);
      const trailing=raw.slice(closing+1).trim();if(trailing&&!trailing.startsWith('#'))throw invalidLine(index+1);
    }else value=raw.replace(/\s+#.*$/,'').trimEnd();
    if(Buffer.byteLength(value,'utf8')>MAX_VALUE_BYTES)throw new PlanError(`第 ${index+1} 行的 Secret 超过 48 KiB。`);
    seen.add(name);result.push({name,value});
    if(result.length>100)throw new PlanError('每批最多 100 个 Secret，请拆分。');
  }
  if(!result.length)throw new PlanError('文件中没有可提交的 Secret。');
  return result;
}

function target(input){
  const repo=input.repo,hostname=input.hostname??'github.com';
  if(typeof repo!=='string'||!repo.match(/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9_.][A-Za-z0-9_.-]*$/)||repo.split('/').some(part=>part==='.'||part==='..'))throw new PlanError('仓库须为准确的 OWNER/REPO。');
  if(typeof hostname!=='string'||hostname.length>253||!hostname.split('.').every(label=>label.length<=63&&/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)))throw new PlanError('主机名须为域名，不含协议、端口或路径。');
  return {repository:repo,hostname:hostname.toLowerCase()};
}
async function payload(file){
  if(typeof file!=='string'||!file)throw new PlanError('须指定 Secret 文件。');
  let handle;
  try{
    const before=await lstat(file);
    if(!before.isFile()||before.isSymbolicLink()||before.size>MAX_FILE_BYTES)throw new PlanError('Secret 文件必须是不超过 1 MiB 的普通文件，不能是符号链接。');
    handle=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
    const actual=await handle.stat();
    if(!actual.isFile()||actual.dev!==before.dev||actual.ino!==before.ino||actual.size>MAX_FILE_BYTES)throw new PlanError('Secret 文件在读取前被替换，请重新预览。');
    const bytes=await handle.readFile();if(bytes.length>MAX_FILE_BYTES)throw new PlanError('Secret 文件超过 1 MiB。');
    const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    return {sha256:createHash('sha256').update(bytes).digest('hex'),entries:parseDotenv(text)};
  }catch(error){if(error instanceof PlanError)throw error;throw new PlanError('无法安全读取 UTF-8 Secret 文件，未提交任何 Secret。');}
  finally{await handle?.close();}
}
async function defaultRunGh(args,input){
  return execFileSync('gh',args,{input,encoding:'utf8',stdio:['pipe','pipe','pipe'],windowsHide:true,timeout:30_000,maxBuffer:1024*1024});
}
async function identity(destination,runGh){
  try{
    const account=String(await runGh(['api','--hostname',destination.hostname,'user','--jq','.login'])).trim();
    const repository=String(await runGh(['api','--hostname',destination.hostname,`repos/${destination.repository}`,'--jq','.full_name'])).trim();
    if(!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(account)||repository.toLowerCase()!==destination.repository.toLowerCase())throw Error('identity mismatch');
    return {...destination,repository,account};
  }catch{throw new PlanError('无法核实当前 GitHub 账号与准确仓库，未提交任何 Secret。请先完成 gh 登录并重新预览。');}
}
function confirmationDigest(who,data){
  const plan={hostname:who.hostname,repository:who.repository.toLowerCase(),account:who.account.toLowerCase(),names:data.entries.map(entry=>entry.name),fileSha256:data.sha256};
  return createHash('sha256').update(JSON.stringify(plan)).digest('hex');
}
export async function previewSecrets(input,{runGh=defaultRunGh}={}){
  const destination=target(input),data=await payload(input.file),who=await identity(destination,runGh);
  return {...who,names:data.entries.map(entry=>entry.name),sha256:confirmationDigest(who,data)};
}
export async function applySecrets(input,{runGh=defaultRunGh}={}){
  if(input.confirm!==true)throw new PlanError('须先确认预览中的主机、仓库、账号与 Secret 名称。');
  const destination=target(input);
  if(typeof input.expectedSha256!=='string'||input.expectedSha256.length!==64||!/^[a-f0-9]{64}$/.test(input.expectedSha256)||typeof input.expectedAccount!=='string'||!input.expectedAccount)throw new PlanError('须提供原预览的摘要与账号。');
  const data=await payload(input.file);
  const who=await identity(destination,runGh);if(who.account.toLowerCase()!==input.expectedAccount.toLowerCase())throw new PlanError('当前账号与原预览不同，须重新预览和确认。');
  if(confirmationDigest(who,data)!==input.expectedSha256)throw new PlanError('目标或 Secret 文件与原预览不同，须重新预览和确认。');
  const completed=[];
  for(const [index,entry] of data.entries.entries()){
    try { await runGh(['secret','set',entry.name,'--repo',`${who.hostname}/${who.repository}`],entry.value);completed.push(entry.name); }
    catch{return {...who,status:'unknown',completed,unknown:entry.name,notStarted:data.entries.slice(index+1).map(entry=>entry.name),message:'当前写入结果未知，已停止。先核对目标仓库，不能自动重试或声称全部成功。'};}
  }
  return {...who,status:'completed',completed};
}

const help=`Secret 文件预览和提交（不输出 Secret 值）
node scripts/secrets.mjs preview --repo OWNER/REPO --file PATH [--hostname github.com]
node scripts/secrets.mjs apply --repo OWNER/REPO --file PATH --expected-sha256 HASH --expected-account LOGIN --confirm [--hostname github.com]
只有用户已确认准确目标与名称后才能 apply。结果 unknown 时停止并核对，不自动重放。
`;
async function main(){
  let args;
  try{args=parseArgs({options:{repo:{type:'string'},file:{type:'string'},hostname:{type:'string'},'expected-sha256':{type:'string'},'expected-account':{type:'string'},confirm:{type:'boolean'},help:{type:'boolean'}},allowPositionals:true});}
  catch{throw new PlanError('参数无效，请使用 --help 查看命令格式。');}
  if(args.values.help){process.stdout.write(help);return;}
  const mode=args.positionals[0];if(args.positionals.length!==1||!['preview','apply'].includes(mode))throw new PlanError('须选择 preview 或 apply；使用 --help 查看格式。');
  const input={...args.values,expectedSha256:args.values['expected-sha256'],expectedAccount:args.values['expected-account']};
  const result=await (mode==='preview'?previewSecrets(input):applySecrets(input));
  process.stdout.write(JSON.stringify(result,null,2)+'\n');if(result.status==='unknown')process.exitCode=2;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{process.stderr.write(JSON.stringify({status:'not_started',message:error instanceof PlanError?error.message:'Secret 操作未完成，请核对原请求；不自动重试。'})+'\n');process.exitCode=1;});
}
