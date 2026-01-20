import { Injectable } from '@nestjs/common';
import type { RedactionSummary } from '@entrys/shared';

// Sensitive key names (case-insensitive match)
const SENSITIVE_KEYS = [
  'email',
  'ssn',
  'phone',
  'address',
  'api_key',
  'apikey',
  'token',
  'jwt',
  'private_key',
  'password',
  'secret',
  'db_connection',
  'connection_string',
  'authorization',
  'auth_token',
  'access_token',
  'refresh_token',
];

// Regex patterns for sensitive data in string values
const PATTERNS: { type: string; regex: RegExp }[] = [
  // Email addresses
  {
    type: 'email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  },
  // JWT tokens (three base64url parts separated by dots)
  {
    type: 'jwt',
    regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  },
  // AWS Access Keys
  {
    type: 'aws_key',
    regex: /\b(AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\b/g,
  },
  // PEM private key blocks
  {
    type: 'private_key',
    regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
  },
  // Bearer tokens
  {
    type: 'bearer_token',
    regex: /Bearer\s+[A-Za-z0-9_-]+/gi,
  },
  // Database connection strings with password
  {
    type: 'db_connection',
    regex: /(?:postgresql|mysql|mongodb|redis):\/\/[^:]+:[^@]+@[^\s]+/gi,
  },
  // Generic API keys (common patterns)
  {
    type: 'api_key',
    regex: /\b(sk_live_|sk_test_|pk_live_|pk_test_|api_key_)[A-Za-z0-9]{20,}\b/g,
  },
  // SSN (US)
  {
    type: 'ssn',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  // Phone numbers (various formats)
  {
    type: 'phone',
    regex: /\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
];

export interface ScrubResult {
  scrubbed: unknown;
  redactions: RedactionSummary[];
}

@Injectable()
export class ScrubberService {
  private redactionCounts: Map<string, number> = new Map();

  /**
   * Scrub sensitive data from any value
   */
  scrub(data: unknown): ScrubResult {
    this.redactionCounts.clear();
    const scrubbed = this.scrubValue(data);
    
    const redactions: RedactionSummary[] = [];
    for (const [type, count] of this.redactionCounts) {
      redactions.push({ type, count });
    }
    
    return { scrubbed, redactions };
  }

  private scrubValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.scrubString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.scrubValue(item));
    }

    if (typeof value === 'object') {
      return this.scrubObject(value as Record<string, unknown>);
    }

    return value;
  }

  private scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if the key itself is sensitive
      if (this.isSensitiveKey(key)) {
        result[key] = '[REDACTED]';
        this.incrementCount('key_' + key.toLowerCase());
      } else {
        result[key] = this.scrubValue(value);
      }
    }

    return result;
  }

  private scrubString(str: string): string {
    let result = str;

    for (const { type, regex } of PATTERNS) {
      const matches = str.match(regex);
      if (matches) {
        this.incrementCount(type, matches.length);
        // Replace each match with [REDACTED]
        result = result.replace(regex, '[REDACTED]');
      }
    }

    return result;
  }

  private isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return SENSITIVE_KEYS.some(
      (sensitive) =>
        lowerKey === sensitive ||
        lowerKey.includes(sensitive) ||
        lowerKey.endsWith('_' + sensitive) ||
        lowerKey.startsWith(sensitive + '_'),
    );
  }

  private incrementCount(type: string, count: number = 1): void {
    const current = this.redactionCounts.get(type) || 0;
    this.redactionCounts.set(type, current + count);
  }
}
