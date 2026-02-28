/**
 * Message validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate message content
 * @param content - The message content to validate
 * @returns Validation result with valid flag and optional error message
 */
export function validateMessage(content: string): ValidationResult {
  // Check if empty or only whitespace
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  // Check length
  if (content.length > 500) {
    return { valid: false, error: 'Message cannot exceed 500 characters' };
  }

  return { valid: true };
}

/**
 * Sanitize message content to prevent XSS attacks
 * @param content - The message content to sanitize
 * @returns Sanitized message content
 */
export function sanitizeMessage(content: string): string {
  return content
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 500);
}
