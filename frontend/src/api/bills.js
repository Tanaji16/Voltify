import api from './axios';

/**
 * Upload an electricity bill (PDF/Image) for OCR extraction.
 * POST /api/bills/upload
 * @param {File} file 
 */
export const uploadBill = (file) => {
  const formData = new FormData();
  formData.append('billFile', file);
  return api.post('/api/bills/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // Tesseract OCR can take up to 60 seconds for large images
  });
};
