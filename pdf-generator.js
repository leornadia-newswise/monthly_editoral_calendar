export const PDF_CONFIG = {
  scale: 2,
  pageWidth: 297,
  pageHeight: 210,
  filename: 'NewsWise_2026_Calendar.pdf',
  quality: 0.95
};

export function validatePageDimensions(width, height) {
  return width === PDF_CONFIG.pageWidth && height === PDF_CONFIG.pageHeight;
}

export class PDFStateManager {
  constructor() {
    this.state = { isGenerating: false, currentPage: 0, totalPages: 0, statusMessage: '', error: null };
    this.progressCallbacks = [];
  }
  startGeneration(totalPages) {
    this.state = { isGenerating: true, totalPages, currentPage: 0, error: null, statusMessage: 'Starting...' };
  }
  updateProgress(currentPage, message) {
    if (!this.state.isGenerating) return;
    this.state.currentPage = currentPage;
    this.state.statusMessage = message;
    this.progressCallbacks.forEach(cb => cb(currentPage, this.state.totalPages, message));
  }
  completeGeneration() { this.state.isGenerating = false; }
  failGeneration(err) { this.state.isGenerating = false; this.state.error = err || 'Error'; }
  onProgress(cb) { this.progressCallbacks.push(cb); }
  getState() { return { ...this.state }; }
}

export function getFilename() { return PDF_CONFIG.filename; }

export function createPDFResult(success, error = null) {
  return success ? { success: true, blob: new Blob(['pdf'], { type: 'application/pdf' }) } : { success: false, error: error || 'Failed' };
}

export function isValidPDFResult(result) {
  if (!result || typeof result.success !== 'boolean') return false;
  return result.success ? result.blob instanceof Blob : (typeof result.error === 'string' && result.error.length > 0);
}
