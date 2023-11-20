#!/usr/bin/env node

import { Package, scan, ScanResult } from "./scanner.js";
import fuzzy from "fuzzy";
import { join } from "node:path";
import { scanProjectDirectory } from "./project-scanner.js";
import { runInteractive } from "./interactive.js";
import { writeCdTarget } from "./cd.js";

console.log("module load", performance.now());

const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const options = process.argv.slice(2).filter((a) => a.startsWith("-"));

if (options.includes("--init")) {
  if (args.length === 0) {
    process.stderr.write(
      "monorepo-cd: Specify the name of generated bash function."
    );
    process.exit(1);
  }

  const name = args[0];
  const binary = process.argv[1];

  process.stdout.write(
    `${name}() { ${binary} $@ && cd $(cat /tmp/monorepo-cd-target) }\n`
  );
  process.stdout.write(`
    _${name}() {
      local -a pkg_names
      pkg_names+=(\`${binary} --list\`)
      _alternative 'args:app args:(($pkg_names))'
      return 0
    }
      
    compdef _${name} ${name}
    `);
  process.exit(0);
}

let scanResult: ScanResult;
if (options.includes("-p")) {
  scanResult = scanProjectDirectory(
    process.env.PROJECTS_DIR ?? join(process.env.HOME!, "Projects")
  );
} else {
  scanResult = scan();
}
if (scanResult.packages.length === 0) {
  throw new Error("No packages detected.");
}

if (options.includes("--list")) {
  for (const pkg of scanResult.packages) {
    console.log(pkg.name);
  }
  process.exit(0);
}

if (args.length === 0) {
  // Interactive mode.
  runInteractive(scanResult);
} else {
  if (args[0] === "/") {
    writeCdTarget(scanResult.repositoryRoot);
    process.exit(0);
  } else {
    const filtered = filterPackages(scanResult.packages, args[0]);

    if (filtered.length === 1) {
      writeCdTarget(join(scanResult.repositoryRoot, filtered[0].path));
      process.exit(0);
    } else {
      runInteractive(scanResult, args[0]);
    }
  }
}

function filterPackages(packages: Package[], query: string): Package[] {
  const exactMatches = packages.filter(
    (p) => p.name === query || p.name.split("/").slice(-1)[0] === query
  );
  if (exactMatches.length === 1) {
    return exactMatches;
  }

  const filtered = fuzzy.filter(query, packages, {
    extract: (p) => p.name,
  });

  return filtered.map((f) => f.original);
}
