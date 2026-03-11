import { describe, it, expect } from "vitest";
import { validateConfigUrl } from "./validate-url";

describe("validateConfigUrl", () => {
  it("accepts valid HTTPS URLs", () => {
    expect(validateConfigUrl("https://example.com")).toBe("https://example.com");
    expect(validateConfigUrl("https://api.example.com/v1")).toBe("https://api.example.com/v1");
  });

  it("rejects HTTP URLs without allowLocalhost", () => {
    expect(() => validateConfigUrl("http://example.com")).toThrow("must use HTTPS");
  });

  it("rejects HTTP URLs to non-localhost with allowLocalhost", () => {
    expect(() => validateConfigUrl("http://example.com", { allowLocalhost: true })).toThrow("must use HTTPS");
  });

  it("allows http://localhost when allowLocalhost is true", () => {
    expect(validateConfigUrl("http://localhost:8090", { allowLocalhost: true })).toBe("http://localhost:8090");
  });

  it("allows http://127.0.0.1 when allowLocalhost is true", () => {
    expect(validateConfigUrl("http://127.0.0.1:8090", { allowLocalhost: true })).toBe("http://127.0.0.1:8090");
  });

  it("rejects http://localhost when allowLocalhost is false", () => {
    expect(() => validateConfigUrl("http://localhost:8090")).toThrow("must use HTTPS");
  });

  it("rejects private IP ranges over HTTPS", () => {
    expect(() => validateConfigUrl("https://10.0.0.1/api")).toThrow("private network");
    expect(() => validateConfigUrl("https://172.16.0.1/api")).toThrow("private network");
    expect(() => validateConfigUrl("https://192.168.1.1/api")).toThrow("private network");
    expect(() => validateConfigUrl("https://169.254.1.1/api")).toThrow("private network");
  });

  it("rejects invalid URLs", () => {
    expect(() => validateConfigUrl("not-a-url")).toThrow("Invalid URL");
    expect(() => validateConfigUrl("")).toThrow("Invalid URL");
  });

  it("rejects non-HTTP protocols", () => {
    expect(() => validateConfigUrl("ftp://example.com")).toThrow("must use HTTPS");
  });
});
