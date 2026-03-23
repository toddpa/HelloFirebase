import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail } from "./helpers";

describe("access helpers", () => {
  it("normalizes emails by trimming and lowercasing them", () => {
    expect(normalizeEmail("  Person@Example.com  ")).toBe("person@example.com");
  });

  it("returns null for empty or missing emails", () => {
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });

  it("accepts simple valid email addresses after normalization", () => {
    expect(isValidEmail("  Person@Example.com  ")).toBe(true);
    expect(isValidEmail("team+ops@example.co.uk")).toBe(true);
  });

  it("rejects malformed email addresses", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing-domain@")).toBe(false);
    expect(isValidEmail("@missing-local.com")).toBe(false);
    expect(isValidEmail("two@@example.com")).toBe(false);
  });
});
