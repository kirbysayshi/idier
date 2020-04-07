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
  let caught;
  try {
    await execp('./cli --help');
  } catch (e) {
    caught = e;
  }

  expect(caught.code).toBe(1);
  expect(caught.stdout).toMatch(/--age/);
  expect(caught.stdout).toMatch(/--root/);
  expect(caught.stdout).toMatch(/--archive/);
  expect(caught.stdout).toMatch(/--projects/);
  expect(caught.stdout).toMatch(/--yes/);
});
