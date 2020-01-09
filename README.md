# Idier: Make your projects folder tidier

[Background on why this tool exists](https://kirbysayshi.com/2020/01/05/keeping-my-digital-desk-clean-through-rules-and-tools.html).

Idier is a tool that moves folders into a specially named folder called `_Archive` if the files in those folders have not been modified recently. This tool is meant to automatically tidy up your "projects folder": that bucket of folders probably everyone has. Perhaps you produce music and have a folder with all of your song projects in them. Or a coder with lots of git repos. Using this tool will reduce the clutter and decision making process.

## Usage

An example is probably better than words:

```sh
$ ls
drwxr-xr-x   16 drew  staff   512B Jan  8 23:14 .
drwxr-xr-x+ 138 drew  staff   4.3K Jan  4 23:33 ..
-rw-r--r--@   1 drew  staff    22K Jan  8 23:03 .DS_Store
drwxr-xr-x  161 drew  staff   5.0K Jan  8 23:14 _Archive
drwxr-xr-x   14 drew  staff   448B May 12  2019 project01
drwxr-xr-x   17 drew  staff   544B Jul 14 23:10 project02
drwxr-xr-x   19 drew  staff   608B Oct  5 20:09 project03
drwxr-xr-x   13 drew  staff   416B Oct 17  2010 project04
drwxr-xr-x@  14 drew  staff   448B Jul 24 21:33 project05
drwxr-xr-x@  18 drew  staff   576B Sep  2 19:45 project06
drwxr-xr-x   14 drew  staff   448B Jan  3 00:18 project07
drwxr-xr-x    9 drew  staff   288B Jan  4 17:19 project08
drwxr-xr-x@  26 drew  staff   832B Oct 27 16:59 project09
drwxr-xr-x   14 drew  staff   448B Jan  7 02:23 project10
```

```
$ npx @kirbysayshi/idier
Analyzed 1221 files in 10 projects in 00m00s150ms

Projects untouched for more than 180 days:
  project01 (241 days ago) -> WILL ARCHIVE

Archive above projects? y/N: y
moving /Users/drew/Projects/project01 -> /Users/drew/Projects/_Archive/project01
```

By default, and "untouched" project is one unmodified for more than 180 days. This is configurable, along with other options:

```sh
$ npx @kirbysayshi/idier

idier: Move projects untouched for more than 180 days to /Users/drew/Projects/_Archive!

Options:
  --age [days]          Archive projects if files have been untouched for this many days
                          (current: 180)
  --root [path]         Use this directory as the root for project folders
                          (current: /Users/drew/Projects/)
  --archive [path]      Use this directory as the Archive folder
                          (current: /Users/drew/Projects/_Archive)
  --yes / -y            Do not prompt the user to confirm the archive.
                          (current: false)
  --projects            Print the list of projects and their ages, then exit.
                          (current: false)
```

## Contributing / Development

This project uses [@spotify/web-scripts](https://github.com/spotify/web-scripts) for build, test, lint, auto-format, and release.

Use `yarn commit` so that semantic-release knows when to release during master builds!

- [ ] replace every `@@CHANGE THIS@@` in package.json
- [ ] remove `private: true` if you plan to publish the library to NPM
- [ ] use `yarn commit` when committing to this repo (uses commitizen)
- [ ] set a `license` in your package.json and create a `LICENSE` file
