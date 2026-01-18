export const PDF_CONFIG = {
  scale: 2,
  pageWidth: 297,
  pageHeight: 210,
  filename: 'NewsWise_2026_Calendar.pdf',
  quality: 0.95
};

export function createPDFState() {
  return {
    isGenerating: false,
    currentPage: 0,
    totalPages: 0,
    statusMessage: '',
    error: null
  };
}

export function validatePageDimensions(width, height) {
  return width === PDF_CONFIG.pageWidth && height === PDF_CONFIG.pageHeight;
}

export class PDFStateManager {
  constructor() {
    this.state = createPDFState();
    this.progressCallbacks = [];
  }

  startGeneration(totalPages) {
    this.state.isGenerating = true;
    this.state.totalPages = totalPages;
    this.state.currentPage = 0;
    this.state.error = null;
    this.state.statusMessage = 'Starting PDF generation...';
  }

  updateProgress(currentPage, message) {
    if (!this.state.isGenerating) return;
    this.state.currentPage = currentPage;
    this.state.statusMessage = message;
    this.progressCallbacks.forEach(cb => cb(currentPage, this.state.totalPages, message));
  }

  completeGeneration() {
    this.state.isGenerating = false;
    this.state.statusMessage = 'PDF generation complete';
  }

  failGeneration(errorMessage) {
    this.state.isGenerating = false;
    this.state.error = errorMessage || 'Unknown error occurred';
    this.state.statusMessage = '';
  }

  onProgress(callback) {
    this.progressCallbacks.push(callback);
  }

  getState() {
    return { ...this.state };
  }
}

export function getFilename() {
  return PDF_CONFIG.filename;
}

export function createPDFResult(success, error = null) {
  if (success) {
    return { success: true, blob: new Blob(['mock pdf'], { type: 'application/pdf' }) };
  }
  return { success: false, error: error || 'PDF generation failed' };
}

export function isValidPDFResult(result) {
  if (!result || typeof result !== 'object') return false;
  if (typeof result.success !== 'boolean') return false;
  if (result.success) return result.blob instanceof Blob;
  return typeof result.error === 'string' && result.error.length > 0;
}
