/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

type FileDesc = { absolute: string; relative: string; stats: fs.Stats };

type FolderDesc = {
  relative: string;
  absolute: string;
  absArchiveDest: string;
  daysSinceModified: number;
};

function parseArgv(argv: string[]) {
  const config = {
    age: 180, // days
    // TODO: allow configuring this via a config file? the goal is that you shouldn't need cli args
    // FIXME: if --archive is set, this regexp will fail!
    exclude: /node_modules|\.git\/|.DS_Store|_Archive\//,
    root: process.cwd(),
    archive: path.join(process.cwd(), '_Archive'),
    yes: false,
    help: false,
    projects: false,
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
    // FIXME: this also needs to set excludes properly!
    config.archive = path.isAbsolute(argv[archiveIdx + 1])
      ? argv[archiveIdx + 1]
      : path.join(process.cwd(), argv[archiveIdx + 1]);
  }

  const yesIdx = argv.indexOf('--yes');
  if (yesIdx > -1) config.yes = true;
  const yIdx = argv.indexOf('-y');
  if (yIdx > -1) config.yes = true;

  const projectsIdx = argv.indexOf('--projects');
  if (projectsIdx > -1) config.projects = true;

  const helpIdx = argv.indexOf('--help');
  const help = `
idier: Move projects untouched for more than ${config.age} days to ${config.archive}!

Options: 
  --age [days]          Archive projects if files have been untouched for this many days
                          (current: ${config.age})
  --root [path]         Use this directory as the root for project folders
                          (current: ${config.root})
  --archive [path]      Use this directory as the Archive folder
                          (current: ${config.archive})
  --yes / -y            Do not prompt the user to confirm the archive.
                          (current: ${config.yes})
  --projects            Print the list of projects and their ages, then exit.
                          (current: ${config.projects})
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

function projectDirs(root: string, archive: string, fileList: FileDesc[]) {
  const now = Date.now();
  const projects = new Map<string, FolderDesc>();

  for (let i = 0; i < fileList.length; i++) {
    const desc = fileList[i];
    const folder = extractFirstFolder(desc.relative);
    if (!folder) continue;

    const current: FolderDesc = projects.has(folder)
      ? projects.get(folder)!
      : {
          relative: folder,
          absolute: path.join(root, folder),
          absArchiveDest: path.join(archive, folder),
          daysSinceModified: Number.MAX_SAFE_INTEGER,
        };

    current.daysSinceModified = Math.min(
      current.daysSinceModified,
      msToDays(now - desc.stats.mtimeMs),
    );

    projects.set(folder, current);
  }
  return Array.from(projects.values());
}

function extractFirstFolder(relativePath: string) {
  if (relativePath[0] === path.sep)
    throw new Error(
      `relativePath must be relative, not absolute! ${relativePath}`,
    );

  // There is apparently not really a better way to extract the first path segment.
  const pathParts = relativePath.split(path.sep).filter(Boolean);

  if (pathParts.length <= 1) {
    // if it's only one segment, it's likely not a folder and is just a file.
    return null;
  }

  // Exclude empty strings and avoid ./path/to/folder
  const folder = pathParts.find(p => p !== '' && p !== '.');
  if (!folder) return null;
  return folder;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertNever(_n: never) {
  throw new Error('ShouldNeverHappen');
}

function msToDays(ms: number) {
  return Math.round(ms / 1000 / 3600 / 24);
}

function projectsStalerThan(projects: FolderDesc[], ageDays: number) {
  return projects.filter(t => {
    return t.daysSinceModified > ageDays;
  });
}

function sortProjects(
  projects: FolderDesc[],
  order: 'ALPHA_DESC' | 'SINCE_MODIFIED_ASC',
): FolderDesc[] {
  switch (order) {
    case 'ALPHA_DESC':
      return projects
        .slice()
        .sort((a, b) => a.relative.localeCompare(b.relative));
    case 'SINCE_MODIFIED_ASC':
      return projects
        .slice()
        .sort((a, b) => b.daysSinceModified - a.daysSinceModified);
    default: {
      throw assertNever(order);
    }
  }
}

const logSummary = (
  files: FileDesc[],
  projects: FolderDesc[],
  durationMs: number,
) => {
  const displayMs = `${durationMs % 1000}`.padStart(3, '0');
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.round(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const displaySeconds = `${totalSeconds % 60}`.padStart(2, '0');
  const timing = `${minutes}m${displaySeconds}s${displayMs}ms`;
  console.log(
    `Analyzed ${files.length} files in ${projects.length} projects in ${timing}`,
  );
  console.log();
};

const logProjects = (projects: FolderDesc[], heading = `Projects`) => {
  console.log(`${heading}:`);
  projects.forEach(p => {
    console.log(`  ${p.relative} (${p.daysSinceModified} days ago)`);
  });
};

const logStaleProjects = (stales: FolderDesc[], age: number) => {
  console.log(`Projects untouched for more than ${age} days:`);
  stales.forEach(stale => {
    console.log(
      `  ${stale.relative} (${stale.daysSinceModified} days ago) -> WILL ARCHIVE`,
    );
  });
  console.log();
};

const logNothingToDo = (age: number) =>
  console.log(
    `No projects untouched for more than ${age} days. Nothing to do!`,
  );

const logMove = (stale: FolderDesc) =>
  console.log(`moving ${stale.absolute} -> ${stale.absArchiveDest}`);

async function awaitConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt('Archive above projects? y/N: ');
  rl.prompt();

  for await (const line of rl) {
    if (line.match(/y/i)) {
      return true;
    }

    if (line.match(/n/i) || line.match('')) {
      return false;
    }

    rl.prompt();
  }

  return false;
}

function collectArchive(archive: string, exclude: RegExp) {
  // TODO: this is super hacky. Perhaps the archive should never be a folder but always be strict value? Or unconfigurable?
  const excludesMinusArchive = new RegExp(
    exclude.toString().replace(`|_Archive\/`, ''),
  );

  // Nothing to list if archive doesn't exist!
  if (!archiveExists(archive)) {
    return { archivedProjects: [], archivedFiles: [] };
  }

  const archivedFiles = collectFiles(archive, archive, excludesMinusArchive);
  const archivedProjects = sortProjects(
    projectDirs(archive, path.join(archive, 'FAKE_ARCHIVE'), archivedFiles),
    'SINCE_MODIFIED_ASC',
  );
  return { archivedProjects, archivedFiles };
}

function archiveExists(archive: string) {
  // If stat throws, archive doesn't exist!
  try {
    fs.statSync(archive);
    return true;
  } catch (e) {
    return false;
  }
}

function ensureArchiveExists(archive: string) {
  if (!archiveExists(archive)) {
    fs.mkdirSync(archive, { recursive: true });
  }
}

async function run() {
  const config = parseArgv(process.argv);

  const start = Date.now();
  const files = collectFiles(config.root, config.root, config.exclude);
  const projects = projectDirs(config.root, config.archive, files);
  const stales = projectsStalerThan(projects, config.age);
  const end = Date.now() - start;

  if (config.projects) {
    const archiveStart = Date.now();
    const { archivedProjects, archivedFiles } = collectArchive(
      config.archive,
      config.exclude,
    );
    const archiveEnd = Date.now() - archiveStart;

    logProjects(archivedProjects, 'Archives Oldest -> Newest');
    logSummary(archivedFiles, archivedProjects, archiveEnd);

    logProjects(projects);
    logSummary(files, projects, end);
    return;
  }

  if (stales.length === 0) {
    logSummary(files, projects, end);
    logNothingToDo(config.age);
    return;
  }

  logSummary(files, projects, end);
  logStaleProjects(stales, config.age);

  const move = config.yes ? true : await awaitConfirmation();
  if (move) {
    ensureArchiveExists(config.archive);
    stales.forEach(s => {
      logMove(s);
      fs.renameSync(s.absolute, s.absArchiveDest);
    });
    return;
  }
}

run();
