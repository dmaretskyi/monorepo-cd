import { join, relative, basename } from "path";
import * as fs from 'fs'
import { Package, ScanResult } from "./scanner";

export function scanProjectDirectory(projectDir: string): ScanResult {
  const projects = Array.from(scanForProjects(projectDir, projectDir))

  return {
    repositoryRoot: projectDir,
    packages: projects,
  }
}

function* scanForProjects(dir: string, root: string): IterableIterator<Package> {
  if(fs.existsSync(join(dir, '.git'))) {
      yield {
        name: basename(dir),
        path: relative(root, dir)
      }
      return
  }

  try {
    for(const child of fs.readdirSync(dir)) {
      if(fs.statSync(join(dir, child)).isDirectory()) {
        yield* scanForProjects(join(dir, child), root)
      }   
    }
  } catch {}
}
