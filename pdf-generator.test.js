import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PDF_CONFIG, validatePageDimensions, PDFStateManager, getFilename, createPDFResult, isValidPDFResult } from './pdf-generator.js';

const fcConfig = { numRuns: 100 };

// Property 1: Page Dimensions Consistency - Validates: Requirements 1.3
describe('Property 1: Page Dimensions', () => {
  it('A4 landscape is 297x210mm', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 50 }), () => {
      expect(PDF_CONFIG.pageWidth).toBe(297);
      expect(PDF_CONFIG.pageHeight).toBe(210);
      expect(validatePageDimensions(297, 210)).toBe(true);
    }), fcConfig);
  });
  it('rejects other dimensions', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 500 }), fc.integer({ min: 1, max: 500 }), (w, h) => {
      fc.pre(w !== 297 || h !== 210);
      expect(validatePageDimensions(w, h)).toBe(false);
    }), fcConfig);
  });
});

// Property 2: State Management - Validates: Requirements 4.1, 5.3
describe('Property 2: State Management', () => {
  it('transitions idle->generating->complete', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 50 }), (pages) => {
      const mgr = new PDFStateManager();
      expect(mgr.getState().isGenerating).toBe(false);
      mgr.startGeneration(pages);
      expect(mgr.getState().isGenerating).toBe(true);
      expect(mgr.getState().totalPages).toBe(pages);
      mgr.completeGeneration();
      expect(mgr.getState().isGenerating).toBe(false);
    }), fcConfig);
  });
  it('calls progress for each page', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 20 }), (pages) => {
      const mgr = new PDFStateManager();
      const calls = [];
      mgr.onProgress((c, t, m) => calls.push({ c, t, m }));
      mgr.startGeneration(pages);
      for (let i = 1; i <= pages; i++) mgr.updateProgress(i, `Page ${i}`);
      expect(calls.length).toBe(pages);
    }), fcConfig);
  });
});

// Property 3: Download Trigger - Validates: Requirements 4.2, 4.3
describe('Property 3: Download Trigger', () => {
  it('successful result has blob', () => {
    fc.assert(fc.property(fc.boolean(), (success) => {
      fc.pre(success);
      const result = createPDFResult(true);
      expect(result.success).toBe(true);
      expect(result.blob).toBeInstanceOf(Blob);
    }), fcConfig);
  });
  it('filename is correct', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 100 }), () => {
      expect(getFilename()).toBe('NewsWise_2026_Calendar.pdf');
    }), fcConfig);
  });
});

// Property 4: Error State - Validates: Requirements 4.4
describe('Property 4: Error Handling', () => {
  it('failed result has non-empty error', () => {
    fc.assert(fc.property(fc.string({ minLength: 1 }), (errMsg) => {
      const result = createPDFResult(false, errMsg);
      expect(result.success).toBe(false);
      expect(result.error.length).toBeGreaterThan(0);
    }), fcConfig);
  });
  it('failGeneration sets error state', () => {
    fc.assert(fc.property(fc.string({ minLength: 1 }), (errMsg) => {
      const mgr = new PDFStateManager();
      mgr.startGeneration(10);
      mgr.failGeneration(errMsg);
      expect(mgr.getState().isGenerating).toBe(false);
      expect(mgr.getState().error).toBe(errMsg);
    }), fcConfig);
  });
  it('isValidPDFResult validates correctly', () => {
    fc.assert(fc.property(fc.boolean(), fc.string({ minLength: 1 }), (success, err) => {
      const result = createPDFResult(success, err);
      expect(isValidPDFResult(result)).toBe(true);
    }), fcConfig);
  });
});
