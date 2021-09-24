import fs from "fs";
import { join, dirname, relative } from 'path'

export interface Package {
  name: string
  /**
   * Path from repository root.
   */
  path: string
}

export interface ScanResult {
  repositoryRoot: string
  packages: Package[]
}

export function scan(from = process.cwd()) {
  const repositoryRoot = findRepoRoot(from)
  const packages = Array.from(scanForPackages(repositoryRoot, repositoryRoot))

  return {
    repositoryRoot,
    packages
  }
}

// TODO: Read from gitignore.
const IGNORED_FILE_NAMES = [
  '.git',
  'node_modules',
  'dist'
]

function findRepoRoot(dir: string): string {
  if(fs.existsSync(join(dir, '.git'))) {
    return dir;
  } else {
    if(dir === '/') {
      throw new Error('Not inside a git repository.')
    }

    return findRepoRoot(dirname(dir))
  }
}

function *scanForPackages(dir: string, root: string): IterableIterator<Package> {
  if(fs.existsSync(join(dir, 'package.json'))) {
    try {
      const packageContents = JSON.parse(fs.readFileSync(join(dir, 'package.json'), 'utf-8'))
      if(packageContents.name && !packageContents.workspaces) {
        yield {
          name: packageContents.name,
          path: relative(root, dir)
        }
        return
      }
    } catch {}
  }

  for(const child of fs.readdirSync(dir)) {
    if(IGNORED_FILE_NAMES.includes(child)) {
      continue;
    }
  
    if(fs.statSync(join(dir, child)).isDirectory()) {
      yield* scanForPackages(join(dir, child), root)
    }      
  }
}
