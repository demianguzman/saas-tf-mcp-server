/**
 * Generate smart subdomain name suggestions when a name is taken
 */
export function generateSubdomainSuggestions(name: string, count: number = 5): string[] {
  const suggestions: string[] = [];
  const currentYear = new Date().getFullYear();

  // Environment-based suggestions
  const envSuffixes = ['dev', 'prod', 'staging', 'test', 'demo', 'api', 'app'];
  for (const suffix of envSuffixes) {
    suggestions.push(`${name}-${suffix}`);
    if (suggestions.length >= count) break;
  }

  // Year-based suggestions
  if (suggestions.length < count) {
    suggestions.push(`${name}-${currentYear}`);
    suggestions.push(`${name}${currentYear}`);
  }

  // Numeric suffix suggestions
  if (suggestions.length < count) {
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${name}${i}`);
      if (suggestions.length >= count) break;
    }
  }

  // Alternative prefixes
  if (suggestions.length < count) {
    const prefixes = ['my', 'the', 'get', 'try'];
    for (const prefix of prefixes) {
      suggestions.push(`${prefix}-${name}`);
      if (suggestions.length >= count) break;
    }
  }

  // Return unique suggestions, limited to count
  return [...new Set(suggestions)].slice(0, count);
}

/**
 * Format suggestions for display in error messages
 */
export function formatSuggestions(suggestions: string[]): string {
  if (suggestions.length === 0) {
    return 'No suggestions available';
  }

  if (suggestions.length === 1) {
    return `Try: ${suggestions[0]}`;
  }

  return `Try: ${suggestions.slice(0, -1).join(', ')}, or ${suggestions[suggestions.length - 1]}`;
}
