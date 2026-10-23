import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

test('marketplace subdirectory works after copying it without the repository', async () => {
  const source = fileURLToPath(new URL('../plugins/github/', import.meta.url));
  const manifest = JSON.parse(await readFile(join(source, '.vykor-plugin/plugin.json'), 'utf8'));
  assert.equal(manifest.id, 'dev.vykor.github');
  const parent = await realpath(tmpdir()), temporary = await mkdtemp(join(parent, 'vykor-github-package-'));
  try {
    await cp(source, temporary, { recursive: true, filter: path => !path.split(/[\\/]/).includes('node_modules') });
    const output = execFileSync(process.execPath, ['scripts/validate.mjs'], { cwd: temporary, encoding: 'utf8' });
    assert.match(output, /Validated dev\.vykor\.github@.+: 10 Skills/);
    const help = execFileSync(process.execPath, ['scripts/secrets.mjs', '--help'], { cwd: temporary, encoding: 'utf8' });
    assert.match(help, /expected-account/);
    assert.match(help, /unknown/);
  } finally {
    const target = await realpath(temporary);
    assert.ok(target.startsWith(parent + sep + 'vykor-github-package-'));
    await rm(target, { recursive: true, force: true });
  }
});
