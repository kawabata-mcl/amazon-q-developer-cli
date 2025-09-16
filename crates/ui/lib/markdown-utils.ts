/**
 * Utility functions for markdown processing and validation
 */

/**
 * Check if content contains markdown syntax
 */
export function hasMarkdownSyntax(content: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Headers
    /\*\*.*?\*\*/,           // Bold
    /\*.*?\*/,               // Italic
    /`.*?`/,                 // Inline code
    /```[\s\S]*?```/,        // Code blocks
    /^\s*[-*+]\s+/m,         // Unordered lists
    /^\s*\d+\.\s+/m,         // Ordered lists
    /^\s*>\s+/m,             // Blockquotes
    /\[.*?\]\(.*?\)/,        // Links
    /!\[.*?\]\(.*?\)/,       // Images
    /^\s*\|.*\|.*$/m,        // Tables
    /^\s*---+\s*$/m,         // Horizontal rules
    /^\s*- \[[ x]\]/m,       // Task lists
  ]
  
  return markdownPatterns.some(pattern => pattern.test(content))
}

/**
 * Extract and validate URLs from markdown content
 */
export function extractUrls(content: string): { url: string; isValid: boolean; type: 'link' | 'image' }[] {
  const urls: { url: string; isValid: boolean; type: 'link' | 'image' }[] = []
  
  // Extract image URLs
  const imageMatches = content.matchAll(/!\[.*?\]\((.*?)\)/g)
  for (const match of imageMatches) {
    const url = match[1]
    urls.push({
      url,
      isValid: isValidUrl(url),
      type: 'image'
    })
  }
  
  // Extract link URLs
  const linkMatches = content.matchAll(/(?<!!)\[.*?\]\((.*?)\)/g)
  for (const match of linkMatches) {
    const url = match[1]
    urls.push({
      url,
      isValid: isValidUrl(url),
      type: 'link'
    })
  }
  
  return urls
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    // Check for relative URLs or local file paths
    return /^[./]/.test(url) || /^[a-zA-Z0-9-]+:/.test(url)
  }
}

/**
 * Sanitize markdown content to remove potentially dangerous elements
 */
export function sanitizeMarkdown(content: string): string {
  return content
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    // Remove embed tags
    .replace(/<embed\b[^<]*>/gi, '')
    // Remove form tags
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (except for images)
    .replace(/data:(?!image\/)/gi, '')
}

/**
 * Extract code blocks from markdown content
 */
export function extractMarkdownCodeBlocks(content: string): Array<{
  code: string
  language?: string
  startIndex: number
  endIndex: number
}> {
  const codeBlocks: Array<{
    code: string
    language?: string
    startIndex: number
    endIndex: number
  }> = []
  
  // Match fenced code blocks
  const fencedRegex = /```(\w+)?\n?([\s\S]*?)```/g
  let match
  
  while ((match = fencedRegex.exec(content)) !== null) {
    codeBlocks.push({
      code: match[2].trim(),
      language: match[1] || undefined,
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }
  
  return codeBlocks
}

/**
 * Check if content should be rendered as markdown or plain text
 */
export function shouldRenderAsMarkdown(content: string): boolean {
  // Don't render as markdown if it's just a code block
  const codeBlocks = extractMarkdownCodeBlocks(content)
  if (codeBlocks.length === 1 && codeBlocks[0].code.trim() === content.trim()) {
    return false
  }
  
  // Check for markdown syntax
  return hasMarkdownSyntax(content)
}

/**
 * Process markdown content for safe rendering
 */
export function processMarkdownContent(content: string): {
  sanitized: string
  hasUnsafeContent: boolean
  urls: Array<{ url: string; isValid: boolean; type: 'link' | 'image' }>
} {
  const sanitized = sanitizeMarkdown(content)
  const hasUnsafeContent = sanitized !== content
  const urls = extractUrls(content)
  
  return {
    sanitized,
    hasUnsafeContent,
    urls
  }
}

/**
 * Convert plain text URLs to markdown links
 */
export function autoLinkUrls(content: string): string {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
  return content.replace(urlRegex, '[$1]($1)')
}

/**
 * Truncate markdown content while preserving structure
 */
export function truncateMarkdown(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content
  }
  
  // Try to truncate at a natural break point
  const truncated = content.substring(0, maxLength)
  const lastNewline = truncated.lastIndexOf('\n')
  const lastSpace = truncated.lastIndexOf(' ')
  
  const breakPoint = lastNewline > maxLength * 0.8 ? lastNewline : 
                    lastSpace > maxLength * 0.8 ? lastSpace : 
                    maxLength
  
  return content.substring(0, breakPoint) + '...'
}