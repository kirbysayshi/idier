import fs from 'fs';
import { mockFS } from './test-utils/mockfs';
import { run } from './index';

afterEach(() => {
  mockFS.restore();
  jest.resetAllMocks();
});

// const spiedConsoleLog = jest.spyOn(global.console, 'log');
// function getConsoleLogs() {
//   // Filter out (remove) log lines that are nondeterministic, like timings.
//   return spiedConsoleLog.mock.calls.filter(args => {
//     return args.length ? args[0].match(/\d\dm\d\ds\d\d\dms/) === null : true;
//   });
// }

test('_Archive is not mandatory nor created', async () => {
  mockFS(
    {
      '/froot/proj01/f01': '',
    },
    { createCwd: false, createTmp: false },
  );

  process.chdir('/froot');
  await run(['--projects']);

  const projects = fs.readdirSync('/froot');

  // Must restore to enable snapshots.
  mockFS.restore();

  expect(projects).toMatchInlineSnapshot(`
    Array [
      "proj01",
    ]
  `);
});

test('_Archive is only created if something moves', async () => {
  const days181Ago = new Date();
  days181Ago.setDate(days181Ago.getDate() - 181);

  mockFS(
    {
      '/froot/proj01/f01': mockFS.file({
        content: '',
        mtime: days181Ago,
      }),
      '/froot/proj02/f01': '',
    },
    { createCwd: false, createTmp: false },
  );

  process.chdir('/froot');
  await run(['-y']);
  const projects = fs.readdirSync('/froot');
  const archive = fs.readdirSync('/froot/_Archive');
  // Must restore to enable snapshots.
  mockFS.restore();

  expect(projects).toMatchInlineSnapshot(`
    Array [
      "_Archive",
      "proj02",
    ]
  `);

  expect(archive).toMatchInlineSnapshot(`
    Array [
      "proj01",
    ]
  `);
});
