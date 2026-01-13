# Implementation Plan: PDF Quality Fix

## Overview

This implementation plan converts the design into actionable coding tasks. The approach is to add the html2canvas and jsPDF libraries, create a PDF generator module, update the UI to show progress, and replace the existing print-based PDF functionality with the new high-quality generator.

## Tasks

- [x] 1. Add PDF generation libraries
  - Add html2canvas and jsPDF via CDN script tags in the HTML head
  - Libraries: html2canvas (latest), jsPDF (latest)
  - _Requirements: 1.1, 1.2_

- [x] 2. Create PDF generator module
  - [x] 2.1 Implement the generateHighQualityPDF function
    - Create async function that iterates through all .page elements
    - Use html2canvas to render each page at 2x scale
    - Use jsPDF to create A4 landscape document (297mm x 210mm)
    - Add each rendered canvas as an image to the PDF
    - Return blob for download
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

  - [x] 2.2 Implement progress callback system
    - Accept onProgress callback parameter
    - Call callback with (currentPage, totalPages, statusMessage) for each page
    - _Requirements: 4.1, 5.3_

  - [x] 2.3 Implement error handling
    - Wrap generation in try-catch
    - Return structured result with success/error status
    - Provide user-friendly error messages
    - _Requirements: 4.4_

- [x] 3. Create progress UI components
  - [x] 3.1 Add progress modal HTML structure
    - Create modal overlay with progress bar
    - Add current page / total pages display
    - Add status message area
    - Add cancel button
    - _Requirements: 4.1, 5.3_

  - [x] 3.2 Add progress modal CSS styles
    - Style progress bar with accent color
    - Add animation for progress updates
    - Style to match existing modal design
    - _Requirements: 4.1_

  - [x] 3.3 Implement progress UI update functions
    - showPDFProgress() - display modal and reset state
    - updatePDFProgress(current, total, message) - update progress bar and text
    - hidePDFProgress() - close modal
    - showPDFError(message) - display error with retry button
    - _Requirements: 4.1, 4.4, 5.3_

- [x] 4. Integrate PDF generator with download flow
  - [x] 4.1 Update proceedToSavePDF function
    - Replace window.print() with generateHighQualityPDF call
    - Show progress modal during generation
    - Trigger download on success
    - Show error modal on failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Update downloadAsPDF function
    - Call the new PDF generation flow directly
    - Remove redirect to print modal
    - _Requirements: 4.2_

  - [x] 4.3 Implement browser download trigger
    - Create downloadBlob(blob, filename) helper
    - Use URL.createObjectURL and anchor click pattern
    - Clean up object URL after download
    - _Requirements: 4.2, 4.3_

- [x] 5. Checkpoint - Ensure PDF generation works
  - Test PDF generation in browser
  - Verify all 14 pages are included
  - Check visual quality of output
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Write property tests
  - [x] 6.1 Write property test for page dimensions
    - **Property 1: Page Dimensions Consistency**
    - Use fast-check to generate mock page arrays
    - Verify PDF output has correct dimensions for all pages
    - **Validates: Requirements 1.3**

  - [x] 6.2 Write property test for state management
    - **Property 2: Generation State Management**
    - Verify state transitions: idle → generating → complete/error
    - Verify progress callbacks are called for each page
    - **Validates: Requirements 4.1, 5.3**

  - [x] 6.3 Write property test for download trigger
    - **Property 3: Download Trigger on Success**
    - Verify download is triggered for all successful generations
    - Verify correct filename is used
    - **Validates: Requirements 4.2, 4.3**

  - [x] 6.4 Write property test for error handling
    - **Property 4: Error State on Failure**
    - Inject failures and verify error state is set
    - Verify error message is non-empty
    - **Validates: Requirements 4.4**

- [x] 7. Final checkpoint
  - Ensure all tests pass
  - Verify PDF quality meets requirements
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The html2canvas library may have issues with external images (logo) - may need to handle CORS or embed images as base64
- Memory usage should be monitored for the 14-page generation
- Consider adding a "generating page X of 14" message for user feedback
