importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

self.addEventListener('message', async (e) => {
  const { image } = e.data;
  
  try {
    // Single OCR pass with optimized settings for receipts
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          self.postMessage({
            status: 'progress',
            progress: Math.round(m.progress * 100)
          });
        }
      }
    });

    // Configure Tesseract for receipt scanning
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_COLUMN, // Receipts are single column
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz $.,()-/:€', // Common receipt characters
    });

    const { data: { text } } = await worker.recognize(image);
    
    await worker.terminate();
    
    self.postMessage({
      status: 'complete',
      text: text
    });
    
  } catch (error) {
    self.postMessage({
      status: 'error',
      error: error.message
    });
  }
});