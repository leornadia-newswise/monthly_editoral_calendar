import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PDF_CONFIG, validatePageDimensions } from "./pdf-generator.js";

const fcConfig = { numRuns: 100 };

describe("Property 1: Page Dimensions Consistency", () => {
  it("validates A4 landscape dimensions", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), () => {
        expect(PDF_CONFIG.pageWidth).toBe(297);
        expect(PDF_CONFIG.pageHeight).toBe(210);
        expect(validatePageDimensions(297, 210)).toBe(true);
      }),
      fcConfig
    );
  });

  it("rejects non-A4 dimensions", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (w, h) => {
          fc.pre(w !== 297 || h !== 210);
          expect(validatePageDimensions(w, h)).toBe(false);
        }
      ),
      fcConfig
    );
  });
});
