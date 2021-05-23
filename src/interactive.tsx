import { ScanResult } from "./scanner"
import { Box, render, Text, useApp, useInput } from 'ink'
import React, { useEffect, useState } from 'react'
import { filter } from 'fuzzy'
import { join } from "path"
import { writeCdTarget } from "./cd"

export function runInteractive(scanResult: ScanResult, initialPrompt = '') {
  // Clear target in case the script is killed.
  writeCdTarget('.')

  render(<App scanResult={scanResult} initialPrompt={initialPrompt} />)
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
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if(key.upArrow) {
      setSelectedIndex(prev => prev + 1)
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
    <Box flexDirection="column" height={13}>
      <Box height={12} flexDirection="column-reverse">
        {filtered.slice(0, 12).map((pkg, idx) => (
          <Box key={pkg.original.name + idx.toString()} flexDirection='row' justifyContent='space-between'>
            <HighlightedString inverse={idx === selectedIndex}>{pkg.string}</HighlightedString>
            <Text inverse={idx === selectedIndex} dimColor>{pkg.original.path}</Text>
          </Box>
        ))}
      </Box>
      <Text><Text color="blue">{'>'}</Text> {userInput}</Text>
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
