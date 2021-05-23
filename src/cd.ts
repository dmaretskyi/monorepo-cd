import * as fs from 'fs'

export function writeCdTarget(path: string) {
  fs.writeFileSync('/tmp/monorepo-cd-target', path, { encoding: 'utf-8' })
}

