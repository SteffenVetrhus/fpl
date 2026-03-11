import { describe, it, expect } from "vitest";
import { sanitizeFilterNumber, sanitizeFilterString } from "./sanitize";

describe("sanitizeFilterNumber", () => {
  it("passes through valid numbers", () => {
    expect(sanitizeFilterNumber(42)).toBe(42);
    expect(sanitizeFilterNumber(0)).toBe(0);
    expect(sanitizeFilterNumber(-5)).toBe(-5);
    expect(sanitizeFilterNumber(3.14)).toBeCloseTo(3.14);
  });

  it("coerces numeric strings", () => {
    expect(sanitizeFilterNumber("42")).toBe(42);
    expect(sanitizeFilterNumber("0")).toBe(0);
  });

  it("throws on NaN", () => {
    expect(() => sanitizeFilterNumber("abc")).toThrow("Invalid numeric filter value");
    expect(() => sanitizeFilterNumber(NaN)).toThrow("Invalid numeric filter value");
    expect(() => sanitizeFilterNumber(undefined)).toThrow("Invalid numeric filter value");
  });

  it("throws on Infinity", () => {
    expect(() => sanitizeFilterNumber(Infinity)).toThrow("Invalid numeric filter value");
    expect(() => sanitizeFilterNumber(-Infinity)).toThrow("Invalid numeric filter value");
  });
});

describe("sanitizeFilterString", () => {
  it("passes through valid PocketBase record IDs", () => {
    expect(sanitizeFilterString("abc123def456ghi")).toBe("abc123def456ghi");
  });

  it("passes through email addresses", () => {
    expect(sanitizeFilterString("john@fpl.local")).toBe("john@fpl.local");
  });

  it("passes through numeric string IDs", () => {
    expect(sanitizeFilterString("12345")).toBe("12345");
  });

  it("passes through strings with hyphens and underscores", () => {
    expect(sanitizeFilterString("league-id_123")).toBe("league-id_123");
  });

  it("throws on empty string", () => {
    expect(() => sanitizeFilterString("")).toThrow("Invalid string filter value");
  });

  it("throws on strings with quotes", () => {
    expect(() => sanitizeFilterString('"injection')).toThrow("Invalid string filter value");
    expect(() => sanitizeFilterString("'injection")).toThrow("Invalid string filter value");
  });

  it("throws on strings with filter operators", () => {
    expect(() => sanitizeFilterString("a && b")).toThrow("Invalid string filter value");
    expect(() => sanitizeFilterString("a || b")).toThrow("Invalid string filter value");
    expect(() => sanitizeFilterString("a = b")).toThrow("Invalid string filter value");
  });

  it("throws on strings with parentheses", () => {
    expect(() => sanitizeFilterString("a(b)")).toThrow("Invalid string filter value");
  });

  it("throws on backslash injection", () => {
    expect(() => sanitizeFilterString("a\\b")).toThrow("Invalid string filter value");
  });
});
