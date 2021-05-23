import chalk from "chalk"
import { Package, scan } from "./scanner"
import { max } from "./util"
import { Box, DOMElement, measureElement, Newline, render, Text, TextProps, useApp, useInput } from 'ink'
import React, { useEffect, useRef, useState } from 'react'
import { filter } from 'fuzzy'
import { join } from "path"
import fs from 'fs'

async function main() {
  const args = process.argv.slice(2)

  const { repositoryRoot, packages } = scan()
  if(packages.length === 0) {
    throw new Error('No packages detected.')
  }

  if(args.length === 0) { // Interactive mode.
    // Clear target in case the script is killed.
    fs.writeFileSync('/tmp/monorepo-cd-target', '.', { encoding: 'utf-8' })
    render(<App packages={packages} repositoryRoot={repositoryRoot} />)
  }
}

interface AppProps {
  packages: Package[]
  repositoryRoot: string
}

function App({ packages, repositoryRoot }: AppProps) {
  const [userInput, setUserInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { exit } = useApp()

  const filtered = filter(userInput, packages, {
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
        fs.writeFileSync('/tmp/monorepo-cd-target', join(repositoryRoot, selectedPackage.path), { encoding: 'utf-8' })
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
