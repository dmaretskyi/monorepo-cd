import { Package, scan, ScanResult } from "./scanner"
import { Box, render, Text, useApp, useInput } from 'ink'
import React, { useEffect, useState } from 'react'
import { filter } from 'fuzzy'
import { join } from "path"
import fs from 'fs'
import { scanProjectDirectory } from "./project-scanner"

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('-'))
  const options = process.argv.slice(2).filter(a => a.startsWith('-'))

  if(options.includes('--init')) {
    process.stdout.write(`m() { ${process.argv[1]} $@ && cd $(cat /tmp/monorepo-cd-target) }\n`)
    return
  } 

  let scanResult: ScanResult;
  if(options.includes('-p')) {
    scanResult = scanProjectDirectory(join(process.env.HOME!, 'Projects'))
  } else {
    scanResult = scan()
  }
  if(scanResult.packages.length === 0) {
    throw new Error('No packages detected.')
  }
  
  if(args.length === 0) { // Interactive mode.
    runInteractive(scanResult)
  } else {
    if(args[0] === '/') {
      writeCdTarget(scanResult.repositoryRoot)
      process.exit(0)
    } else {
      const filtered = filter(args[0], scanResult.packages, {
        extract: p => p.name,
      });

      if(filtered.length === 1) {
        writeCdTarget(join(scanResult.repositoryRoot, filtered[0].original.path))
        process.exit(0)
      } else {
        runInteractive(scanResult, args[0])
      }
    }
  }
}

function runInteractive(scanResult: ScanResult, initialPrompt = '') {
  // Clear target in case the script is killed.
  writeCdTarget('.')

  render(<App scanResult={scanResult} initialPrompt={initialPrompt} />)
}

function writeCdTarget(path: string) {
  fs.writeFileSync('/tmp/monorepo-cd-target', path, { encoding: 'utf-8' })
}

interface AppProps {
  scanResult: ScanResult
  initialPrompt: string
}

function App({ scanResult, initialPrompt }: AppProps) {
  const [userInput, setUserInput] = useState(initialPrompt);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { exit } = useApp()

  const filtered = filter(userInput, scanResult.packages, {
     extract: p => p.name,
     pre: '$',
     post: '$'
  });

  useEffect(() => {
    if(selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(filtered.length - 1, 0))
    }
  }, [filtered.length, selectedIndex])

  useInput((input, key) => {
    if(key.downArrow) {
      setSelectedIndex(prev => prev + 1)
    } else if(key.upArrow) {
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if(key.return) {
      const selectedPackage = filtered[selectedIndex]?.original
      if(selectedPackage) {
        writeCdTarget(join(scanResult.repositoryRoot, selectedPackage.path))
        exit()
      }
    } else if(key.ctrl && input === 'w') { // Option + Delete generates this sequence.
      setUserInput('')
    } else if(key.backspace || key.delete) {
      setUserInput(prev => prev.slice(0, -1))
    } else {
      setUserInput(prev => prev + input)
    }
  })

  return (
    <Box flexDirection="column">
      <Text>$ {userInput}</Text>
      {filtered.slice(0, 12).map((pkg, idx) => (
        <Box key={pkg.original.name} flexDirection='row' justifyContent='space-between'>
          <HighlightedString inverse={idx === selectedIndex}>{pkg.string}</HighlightedString>
          <Text inverse={idx === selectedIndex} dimColor>{pkg.original.path}</Text>
        </Box>
      ))}
    </Box>
  )
}

interface HighlightedStringProps {
  children: string
  inverse?: boolean
}

function HighlightedString({ children, inverse }: HighlightedStringProps) {
  const parts = children.split('$')

  return (
    <Text inverse={inverse}>
      {parts.map((s, i) => (
        <Text key={i} color={i % 2 === 0 ? undefined : 'red'}>{s}</Text>
      ))}
    </Text>
  )
}

main()
