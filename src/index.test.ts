import { exec } from 'child_process';
import { promisify } from 'util';

const execp = promisify(exec);

test('display help', async () => {
  try {
    await execp('npx ts-run ./src/index.ts --help');
  } catch (e) {
    expect(e.stdout).toMatchInlineSnapshot(`
      "
      idier: Move projects untouched for more than 180 days to /Users/drew/Projects/idier/_Archive!

      Options: 
        --age [days]          Archive projects if files have been untouched for this many days
                                (current: 180)
        --root [path]         Use this directory as the root for project folders
                                (current: /Users/drew/Projects/idier)
        --archive [path]      Use this directory as the Archive folder
                                (current: /Users/drew/Projects/idier/_Archive)
        --yes / -y            Do not prompt the user to confirm the archive.
                                (current: false)
        --projects            Print the list of projects and their ages, then exit.
                                (current: false)

      "
    `);
  }
});
