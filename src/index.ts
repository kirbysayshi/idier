/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

type FileDesc = { absolute: string; relative: string; stats: fs.Stats };

type FolderDesc = {
  relative: string;
  absolute: string;
  absoluteArchiveDest: string;
  mostRecentMtimeMs: number;
  mostRecentMtimeDays: number;
  relativeToNowMtimeDays: number;
};

function parseArgv(argv: string[]) {
  const config = {
    age: 180, // days
    exclude: /node_modules|\.git\/|.DS_Store|_Archive\//,
    root: process.cwd(),
    archive: path.join(process.cwd(), '_Archive'),
    dryRun: false,
    help: false,
  };

  const ageIdx = argv.indexOf('--days');
  if (ageIdx > -1) {
    config.age = parseInt(argv[ageIdx + 1], 10);
  }

  const rootIdx = argv.indexOf('--root');
  if (rootIdx > -1) {
    config.root = argv[rootIdx + 1];
    config.archive = path.join(config.root, '_Archive');
  }

  const archiveIdx = argv.indexOf('--archive');
  if (archiveIdx > -1) {
    config.archive = path.isAbsolute(argv[archiveIdx + 1])
      ? argv[archiveIdx + 1]
      : path.join(process.cwd(), argv[archiveIdx + 1]);
  }

  const dryRunIdx = argv.indexOf('--dry-run');
  if (dryRunIdx > -1) config.dryRun = true;

  const helpIdx = argv.indexOf('--help');
  const help = `
Wedge: Move projects untouched for more than ${config.age} days to ${config.archive}!

Options: 
  --age [days]          Archive projects with files modified longer than this many days
                          (current: ${config.age})
  --root [path]         Use this directory as the root for project folders
                          (current: ${config.root})
  --archive [path]      Use this directory as the Archive folder
                          (current: ${config.archive})
  --dry-run             Don't move any files, just report what _would_ be moved
                          (current: ${config.dryRun})
`;

  if (helpIdx > -1) {
    console.log(help);
    process.exit(1);
  }

  return config;
}

function collectFiles(
  root: string,
  dir: string,
  excludes: RegExp,
  fileList: FileDesc[] = [],
) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const fileStat = fs.lstatSync(filePath);
    const ignore = excludes.test(filePath);

    if (ignore) return;

    if (fileStat.isDirectory()) {
      collectFiles(root, filePath, excludes, fileList);
    } else {
      fileList.push({
        absolute: filePath,
        relative: path.relative(root, filePath),
        stats: fileStat,
      });
    }
  });

  return fileList;
}

function topLevelDirectoryAge(
  root: string,
  archive: string,
  fileList: FileDesc[],
) {
  const now = Date.now();
  const topLevels: FolderDesc[] = [];
  let currentTopLevel: FolderDesc | undefined = topLevels[0];
  for (let i = 0; i < fileList.length; i++) {
    const desc = fileList[i];
    const pathParts = desc.relative.split(path.sep).filter(Boolean);
    const topLevel = pathParts[0];
    // if it's only one segment, it's likely not a folder and is just a file.
    if (!topLevel || pathParts.length <= 1) continue;
    if (!currentTopLevel || currentTopLevel.relative !== topLevel) {
      // new project folder! close the old and reset
      topLevels.push({
        relative: topLevel,
        absolute: path.join(root, topLevel),
        absoluteArchiveDest: path.join(archive, topLevel),
        mostRecentMtimeMs: 0,
        mostRecentMtimeDays: 0,
        relativeToNowMtimeDays: Number.MAX_SAFE_INTEGER,
      });
      currentTopLevel = topLevels[topLevels.length - 1];
    }
    // TODO: could probably remove these
    currentTopLevel.mostRecentMtimeMs = Math.max(
      currentTopLevel.mostRecentMtimeMs,
      desc.stats.mtimeMs,
    );
    currentTopLevel.mostRecentMtimeDays = Math.max(
      currentTopLevel.mostRecentMtimeDays,
      Math.round(desc.stats.mtimeMs / 1000 / 3600 / 24),
    );
    currentTopLevel.relativeToNowMtimeDays = Math.min(
      currentTopLevel.relativeToNowMtimeDays,
      Math.round((now - desc.stats.mtimeMs) / 1000 / 3600 / 24),
    );
  }
  return topLevels.filter(
    f =>
      Boolean(f.relative) &&
      Boolean(f.mostRecentMtimeMs) &&
      Boolean(f.mostRecentMtimeDays),
  );
}

function topLevelsStalerThan(topLevels: FolderDesc[], ageDays: number) {
  return topLevels.filter(t => {
    return t.relativeToNowMtimeDays > ageDays;
  });
}

async function run() {
  const config = parseArgv(process.argv);

  const files = collectFiles(config.root, config.root, config.exclude);
  const projects = topLevelDirectoryAge(config.root, config.archive, files);
  const stales = topLevelsStalerThan(projects, config.age);

  console.log(`analyzed ${files.length} files in ${projects.length} projects.`);
  console.log(`projects:`);
  projects.forEach(p => {
    console.log(`  ${p.relative} (${p.relativeToNowMtimeDays} days ago)`);
  });

  stales.forEach(s => {
    console.log(
      `project ${s.relative} (${s.relativeToNowMtimeDays}) is older than ${config.age} days!`,
    );
    if (config.dryRun) {
      console.log(
        `--dry-run, skipping ${s.absolute} -> ${s.absoluteArchiveDest}`,
      );
    } else {
      console.log(`moving ${s.absolute} -> ${s.absoluteArchiveDest}`);
      fs.renameSync(s.absolute, s.absoluteArchiveDest);
    }
  });
}

run();
