import { HttpException } from '@nestjs/common';

export function requireValue(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new HttpException(message, status);
}

export function record(value: unknown): Record<string, unknown> {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), 'Invalid form data.');
  return value as Record<string, unknown>;
}

export function cleanText(value: unknown, label: string, max: number, min = 0): string {
  requireValue(typeof value === 'string' || (value == null && !min), `${label} is required.`);
  const text = typeof value === 'string' ? value.trim() : '';
  requireValue(text.length >= min && text.length <= max, `${label} must contain ${min ? `${min}–` : 'at most '}${max} characters.`);
  return text;
}

export function integer(value: unknown, label: string, min: number, max: number): number {
  requireValue(typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max, `${label} must be between ${min} and ${max}.`);
  return value;
}

export function identifier(value: unknown): string {
  requireValue(typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value), 'Invalid item identifier.');
  return value;
}
