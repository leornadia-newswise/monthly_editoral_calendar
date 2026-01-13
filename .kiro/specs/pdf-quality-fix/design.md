# Design Document: PDF Quality Fix

## Overview

This design addresses the PDF quality degradation issue by replacing the browser's native print-to-PDF functionality with a dedicated PDF generation solution using html2canvas and jsPDF libraries. This approach captures each calendar page as a high-resolution image and assembles them into a properly formatted PDF document, ensuring consistent quality across all browsers and devices.

## Architecture

The solution follows a page-by-page rendering approach:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Download Btn│  │ Progress UI │  │ Error Display       │  │
│  └──────┬──────┘  └──────▲──────┘  └──────────▲──────────┘  │
│         │                │                     │             │
└─────────┼────────────────┼─────────────────────┼─────────────┘
          │                │                     │
          ▼                │                     │
┌─────────────────────────────────────────────────────────────┐
│                  PDF Generator Module                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              generateHighQualityPDF()                │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────┐    │    │
│  │  │ Page      │  │ Canvas    │  │ PDF           │    │    │
│  │  │ Iterator  │─▶│ Renderer  │─▶│ Assembler     │    │    │
│  │  └───────────┘  └───────────┘  └───────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Libraries                          │
│  ┌─────────────────┐        ┌─────────────────────────┐     │
│  │   html2canvas   │        │        jsPDF            │     │
│  │  (DOM → Canvas) │        │   (Canvas → PDF)        │     │
│  └─────────────────┘        └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PDF Generator Module

The main module that orchestrates PDF generation.

```javascript
/**
 * Configuration for PDF generation
 */
interface PDFConfig {
  scale: number;           // Render scale (2 = 2x resolution)
  pageWidth: number;       // A4 landscape width in mm (297)
  pageHeight: number;      // A4 landscape height in mm (210)
  filename: string;        // Output filename
  quality: number;         // JPEG quality (0-1)
}

/**
 * Progress callback for UI updates
 */
type ProgressCallback = (current: number, total: number, status: string) => void;

/**
 * Result of PDF generation
 */
interface PDFResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

/**
 * Main PDF generation function
 * @param pages - Array of DOM elements to render
 * @param config - PDF configuration options
 * @param onProgress - Progress callback
 * @returns Promise resolving to PDFResult
 */
async function generateHighQualityPDF(
  pages: HTMLElement[],
  config: PDFConfig,
  onProgress: ProgressCallback
): Promise<PDFResult>
```

### 2. Page Renderer

Converts individual HTML pages to canvas images.

```javascript
/**
 * Renders a single page element to canvas
 * @param element - The page DOM element
 * @param scale - Render scale factor
 * @returns Promise resolving to canvas element
 */
async function renderPageToCanvas(
  element: HTMLElement,
  scale: number
): Promise<HTMLCanvasElement>
```

### 3. UI State Manager

Manages the loading, progress, and error states.

```javascript
/**
 * UI State for PDF generation
 */
interface PDFUIState {
  isGenerating: boolean;
  currentPage: number;
  totalPages: number;
  statusMessage: string;
  error: string | null;
}

/**
 * Updates the UI to reflect current generation state
 */
function updatePDFUI(state: PDFUIState): void
```

## Data Models

### PDF Configuration Defaults

```javascript
const DEFAULT_PDF_CONFIG = {
  scale: 2,                              // 2x resolution for crisp output
  pageWidth: 297,                        // A4 landscape width (mm)
  pageHeight: 210,                       // A4 landscape height (mm)
  filename: 'NewsWise_2026_Calendar.pdf',
  quality: 0.95                          // High JPEG quality
};
```

### Generation State

```javascript
const initialState = {
  isGenerating: false,
  currentPage: 0,
  totalPages: 14,
  statusMessage: '',
  error: null
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Page Dimensions Consistency

*For any* generated PDF document, each page SHALL have dimensions of exactly 297mm (width) × 210mm (height), matching A4 landscape format.

**Validates: Requirements 1.3**

### Property 2: Generation State Management

*For any* PDF generation operation, the system SHALL transition through states in order: idle → generating (with progress updates) → complete/error. The `isGenerating` flag SHALL be true during generation and false otherwise, and progress updates SHALL be emitted for each page processed.

**Validates: Requirements 4.1, 5.3**

### Property 3: Download Trigger on Success

*For any* successful PDF generation, the system SHALL trigger a browser download with the generated blob and the filename "NewsWise_2026_Calendar.pdf".

**Validates: Requirements 4.2, 4.3**

### Property 4: Error State on Failure

*For any* failed PDF generation attempt, the system SHALL set the error state with a non-empty error message and the `isGenerating` flag SHALL be set to false.

**Validates: Requirements 4.4**

## Error Handling

### Error Categories

1. **Library Loading Errors**: If html2canvas or jsPDF fail to load
   - Display: "Failed to load PDF generation libraries. Please refresh and try again."
   - Action: Offer retry button

2. **Rendering Errors**: If a page fails to render to canvas
   - Display: "Failed to render page X. Please try again."
   - Action: Offer retry button, log error details to console

3. **PDF Assembly Errors**: If jsPDF fails to create the document
   - Display: "Failed to create PDF document. Please try again."
   - Action: Offer retry button

4. **Memory Errors**: If browser runs out of memory during generation
   - Display: "PDF generation failed due to memory constraints. Try closing other tabs and retry."
   - Action: Offer retry button

### Error Recovery

```javascript
async function generateWithRetry(maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateHighQualityPDF(pages, config, onProgress);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific behaviors and edge cases:

1. **Configuration validation**: Test that invalid configs are rejected
2. **State transitions**: Test that state changes occur correctly
3. **Error message formatting**: Test that errors produce user-friendly messages
4. **Filename generation**: Test that the correct filename is used

### Property-Based Tests

Property-based tests will use a JavaScript PBT library (fast-check) to verify universal properties:

1. **Property 1 (Page Dimensions)**: Generate PDFs with various page counts and verify all pages have correct dimensions
2. **Property 2 (State Management)**: Simulate generation with random delays and verify state transitions
3. **Property 3 (Download Trigger)**: Verify download is triggered for all successful generations
4. **Property 4 (Error Handling)**: Inject random failures and verify error state is set correctly

Each property test will run a minimum of 100 iterations to ensure comprehensive coverage.

### Integration Tests

1. **Full generation flow**: Test complete PDF generation with actual calendar pages
2. **Browser compatibility**: Manual testing across Chrome, Firefox, Safari, Edge
3. **Visual regression**: Compare generated PDFs against baseline images

### Test Configuration

```javascript
// fast-check configuration
const fcConfig = {
  numRuns: 100,
  verbose: true
};
```
