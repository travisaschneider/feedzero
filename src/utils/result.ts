/**
 * Result type for explicit error handling.
 * All core functions return Result instead of throwing.
 */

export type Result<T> = Ok<T> | Err;

interface Ok<T> {
  ok: true;
  value: T;
}

interface Err {
  ok: false;
  error: string;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err(error: string): Err {
  return { ok: false, error };
}

export function isOk<T>(result: Result<T>): result is Ok<T> {
  return result.ok === true;
}

export function isErr<T>(result: Result<T>): result is Err {
  return result.ok === false;
}

export function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  throw new Error(`Unwrap called on err: ${result.error}`);
}

export function unwrapOr<T>(result: Result<T>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export function map<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function mapErr<T>(result: Result<T>, fn: (error: string) => string): Result<T> {
  return result.ok ? result : err(fn(result.error));
}
