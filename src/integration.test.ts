import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
const execp = promisify(exec);

try {
  fs.statSync('./esm');
  fs.statSync('./cjs');
  fs.statSync('./types');
} catch (e) {
  throw new Error(
    'Could not find compiled sources to test CLI. Did you run `yarn build`?',
  );
}

test('display help via bin', async () => {
  try {
    await execp('./cli --help');
  } catch (e) {
    expect(e.code).toBe(1);
    expect(e.stdout).toMatch(/--age/);
    expect(e.stdout).toMatch(/--root/);
    expect(e.stdout).toMatch(/--archive/);
    expect(e.stdout).toMatch(/--projects/);
    expect(e.stdout).toMatch(/--yes/);
  }
});
