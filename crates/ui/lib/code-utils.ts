/**
 * Utilities for code block detection and processing
 */

export interface CodeBlock {
  language: string
  code: string
  startIndex: number
  endIndex: number
}

/**
 * Extract code blocks from markdown text
 */
export function extractCodeBlocks(text: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  return codeBlocks
}

/**
 * Check if text contains code blocks
 */
export function hasCodeBlocks(text: string): boolean {
  return /```[\s\S]*?```/.test(text)
}

/**
 * Extract inline code from text
 */
export function extractInlineCode(text: string): Array<{
  code: string
  startIndex: number
  endIndex: number
}> {
  const inlineCode: Array<{
    code: string
    startIndex: number
    endIndex: number
  }> = []
  
  const inlineCodeRegex = /`([^`]+)`/g
  let match

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    inlineCode.push({
      code: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  return inlineCode
}

/**
 * Check if text contains inline code
 */
export function hasInlineCode(text: string): boolean {
  return /`[^`]+`/.test(text)
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(language: string): string {
  const languageNames: Record<string, string> = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'rust': 'Rust',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'csharp': 'C#',
    'go': 'Go',
    'php': 'PHP',
    'ruby': 'Ruby',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'bash': 'Bash',
    'shell': 'Shell',
    'json': 'JSON',
    'yaml': 'YAML',
    'toml': 'TOML',
    'sql': 'SQL',
    'css': 'CSS',
    'scss': 'SCSS',
    'html': 'HTML',
    'xml': 'XML',
    'markdown': 'Markdown',
    'jsx': 'JSX',
    'tsx': 'TSX',
    'text': 'Text',
    'plaintext': 'Plain Text'
  }

  return languageNames[language.toLowerCase()] || language.toUpperCase()
}

/**
 * Detect programming language from code content
 */
export function detectLanguage(code: string): string {
  const trimmedCode = code.trim()
  
  // Check for common patterns
  if (trimmedCode.includes('function ') || trimmedCode.includes('const ') || trimmedCode.includes('let ')) {
    if (trimmedCode.includes(': ') && (trimmedCode.includes('interface ') || trimmedCode.includes('type '))) {
      return 'typescript'
    }
    return 'javascript'
  }
  
  if (trimmedCode.includes('def ') || trimmedCode.includes('import ') && trimmedCode.includes('from ')) {
    return 'python'
  }
  
  if (trimmedCode.includes('fn ') || trimmedCode.includes('let mut ') || trimmedCode.includes('use std::')) {
    return 'rust'
  }
  
  if (trimmedCode.includes('public class ') || trimmedCode.includes('import java.')) {
    return 'java'
  }
  
  if (trimmedCode.includes('#include') || trimmedCode.includes('int main(')) {
    return 'cpp'
  }
  
  if (trimmedCode.includes('package ') || trimmedCode.includes('func ')) {
    return 'go'
  }
  
  if (trimmedCode.includes('<?php') || trimmedCode.includes('$')) {
    return 'php'
  }
  
  if (trimmedCode.includes('class ') && trimmedCode.includes('end')) {
    return 'ruby'
  }
  
  if (trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) {
    try {
      JSON.parse(trimmedCode)
      return 'json'
    } catch {
      // Not valid JSON
    }
  }
  
  if (trimmedCode.includes('<!DOCTYPE') || trimmedCode.includes('<html')) {
    return 'html'
  }
  
  if (trimmedCode.includes('SELECT ') || trimmedCode.includes('INSERT ') || trimmedCode.includes('UPDATE ')) {
    return 'sql'
  }
  
  if (trimmedCode.includes('#!/bin/bash') || trimmedCode.includes('#!/bin/sh')) {
    return 'bash'
  }
  
  return 'text'
}

/**
 * Format code for display
 */
export function formatCode(code: string): string {
  // Remove excessive whitespace while preserving indentation
  const lines = code.split('\n')
  
  // Remove empty lines at the beginning and end
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift()
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }
  
  return lines.join('\n')
}