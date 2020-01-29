import { exec } from 'child_process';
import { promisify } from 'util';

const execp = promisify(exec);

test('display help', async () => {
  try {
    await execp('npx ts-run ./src/index.ts --help');
  } catch (e) {
    expect(e.code).toBe(1);
    expect(e.stdout).toMatch(/--age/);
    expect(e.stdout).toMatch(/--root/);
    expect(e.stdout).toMatch(/--archive/);
    expect(e.stdout).toMatch(/--projects/);
    expect(e.stdout).toMatch(/--yes/);
  }
});

// TODO: expand these with mock-fs: https://www.npmjs.com/package/mock-fs
