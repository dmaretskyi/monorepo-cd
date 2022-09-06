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
  // Special case for Rush monorepos.
  if(fs.existsSync(join(root, 'rush.json'))) {
    try {
      const { projects } = parseRushJson(join(root, 'rush.json'))
      for(const project of projects) {
        const path = join(dir, project.projectFolder)
        const packageContents = JSON.parse(fs.readFileSync(join(root, project.projectFolder, 'package.json'), 'utf-8'))
        if(isPackage(packageContents, path)) {
          yield {
            name: packageContents.name,
            path: relative(root, path)
          }
        }
      }
      return
    } catch {} // On error fall back to normal scanning.
  }
  
  if(fs.existsSync(join(dir, 'package.json'))) {
    try {
      const packageContents = JSON.parse(fs.readFileSync(join(dir, 'package.json'), 'utf-8'))
      if(isPackage(packageContents, dir)) {
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

function isPackage(packageJson: any, directoryPath: string): boolean {
  if(!packageJson.name) {
    return false;
  }
  if(packageJson.workspaces) {
    return false;
  }
  if(fs.existsSync(join(directoryPath, 'pnpm-workspace.yaml'))) {
    return false;
  }
  return true;
}

interface RushJson {
  projects: {
    packageName: string,
    projectFolder: string,
  }[]
}

function parseRushJson(path: string): RushJson {
  return eval(`(${fs.readFileSync(path, 'utf8')})`)
}