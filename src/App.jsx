import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, AlertCircle, Share2, Camera, Upload, X } from 'lucide-react';
import ReactGA from 'react-ga4';

console.log('Vite env:', import.meta.env);
console.log('Vite env:', import.meta.env.VITE_TEST_VAR);
console.log('Veryfi client id:', import.meta.env.VITE_VERYFI_CLIENT_ID);
console.log('Veryfi username:', import.meta.env.VITE_VERYFI_USERNAME);
console.log('Veryfi api key:', import.meta.env.VITE_VERYFI_API_KEY);

export default function ReceiptSplitterApp() {
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [personName, setPersonName] = useState('');
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [tipSplitMethod, setTipSplitMethod] = useState('proportional');
  const [editingPerson, setEditingPerson] = useState(null);
  const [editName, setEditName] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [expandedPeople, setExpandedPeople] = useState({});
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [percentages, setPercentages] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [venmoUsername, setVenmoUsername] = useState('');
  const [showVenmoError, setShowVenmoError] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [showScanTips, setShowScanTips] = useState(true);
  const [processingMethod, setProcessingMethod] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [extractedTax, setExtractedTax] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const workerRef = useRef(null);


  // Initialize Google Analytics
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-2J1Y4LT9CE';
    ReactGA.initialize(measurementId);
    // Track initial page view
    ReactGA.send({ hitType: "pageview", page: "/", title: "Main Screen" });
  }, []);

  // Track when summary is viewed
  useEffect(() => {
    if (showSummary) {
      ReactGA.send({ hitType: "pageview", page: "/summary", title: "Summary Screen" });
      ReactGA.event({
        category: 'User',
        action: 'summary_viewed'
      });
    }
  }, [showSummary]);

  // Sort people alphabetically
  const sortedPeople = [...people].sort((a, b) => a.name.localeCompare(b.name));

  // Load Venmo username from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('organizerVenmoUsername');
    if (saved) {
      setVenmoUsername(saved);
    }
  }, []);

  // Save Venmo username to localStorage whenever it changes
  const handleVenmoUsernameChange = (value) => {
    setVenmoUsername(value);
    localStorage.setItem('organizerVenmoUsername', value);
  };

  const addItem = () => {
    if (itemName.trim() && itemPrice) {
      const price = parseFloat(itemPrice);
      if (!isNaN(price) && price > 0) {
        setItems([...items, { 
          id: Date.now(), 
          name: itemName.trim(), 
          price,
          claimedBy: []
        }]);
        setItemName('');
        setItemPrice('');
        
        // Track item added
        ReactGA.event({
          category: 'User',
          action: 'item_added',
          label: 'Manual Entry'
        });
      }
    }
  };

  const deleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const addPerson = () => {
    if (personName.trim()) {
      setPeople([...people, { id: Date.now(), name: personName.trim() }]);
      setPersonName('');
      
      // Track person added
      ReactGA.event({
        category: 'User',
        action: 'person_added'
      });
    }
  };

  const deletePerson = (personId) => {
    setPeople(people.filter(p => p.id !== personId));
    setItems(items.map(item => ({
      ...item,
      claimedBy: item.claimedBy.filter(claim => claim.personId !== personId)
    })));
  };

  const startEditPerson = (person) => {
    setEditingPerson(person.id);
    setEditName(person.name);
  };

  const saveEditPerson = () => {
    if (editName.trim()) {
      setPeople(people.map(p => 
        p.id === editingPerson ? { ...p, name: editName.trim() } : p
      ));
    }
    setEditingPerson(null);
    setEditName('');
  };

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemPrice(item.price.toString());
  };

  const saveEditItem = () => {
    if (editItemName.trim() && editItemPrice) {
      const price = parseFloat(editItemPrice);
      if (!isNaN(price) && price > 0) {
        setItems(items.map(item =>
          item.id === editingItemId 
            ? { ...item, name: editItemName.trim(), price }
            : item
        ));
      }
    }
    setEditingItemId(null);
    setEditItemName('');
    setEditItemPrice('');
  };

  const toggleClaimItem = (itemId, personId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const alreadyClaimed = item.claimedBy.some(c => c.personId === personId);
        
        if (alreadyClaimed) {
          return {
            ...item,
            claimedBy: item.claimedBy.filter(c => c.personId !== personId)
          };
        } else {
          return {
            ...item,
            claimedBy: [...item.claimedBy, { personId, percentage: null }]
          };
        }
      }
      return item;
    }));
  };

  const openAdjustPercentages = (item) => {
    const initialPercentages = {};
    const numPeople = item.claimedBy.length;
    const evenSplit = 100 / numPeople;
    
    item.claimedBy.forEach(claim => {
      initialPercentages[claim.personId] = claim.percentage || evenSplit;
    });
    
    setPercentages(initialPercentages);
    setAdjustingItem(item.id);
  };

  const updatePercentage = (personId, newValue) => {
    const item = items.find(i => i.id === adjustingItem);
    const otherPeople = item.claimedBy.filter(c => c.personId !== personId);
    
    const newPercentages = { ...percentages };
    newPercentages[personId] = newValue;
    
    // Distribute remaining percentage among others
    const remaining = 100 - newValue;
    const numOthers = otherPeople.length;
    
    if (numOthers > 0) {
      const shareEach = remaining / numOthers;
      otherPeople.forEach(claim => {
        newPercentages[claim.personId] = shareEach;
      });
    }
    
    setPercentages(newPercentages);
  };

  const savePercentages = () => {
    setItems(items.map(item => {
      if (item.id === adjustingItem) {
        return {
          ...item,
          claimedBy: item.claimedBy.map(claim => ({
            ...claim,
            percentage: percentages[claim.personId]
          }))
        };
      }
      return item;
    }));
    setAdjustingItem(null);
    setPercentages({});
  };

  const calculatePersonCost = (item, personId) => {
    const claim = item.claimedBy.find(c => c.personId === personId);
    if (!claim) return 0;
    
    if (claim.percentage !== null) {
      return (item.price * claim.percentage) / 100;
    }
    
    return item.price / item.claimedBy.length;
  };

  const calculateTotals = () => {
    const taxAmount = parseFloat(tax) || 0;
    const tipAmount = parseFloat(tip) || 0;
    
    const totals = {};
    
    sortedPeople.forEach(person => {
      let subtotal = 0;
      const claimedItems = [];
      
      items.forEach(item => {
        if (item.claimedBy.some(c => c.personId === person.id)) {
          const cost = calculatePersonCost(item, person.id);
          subtotal += cost;
          claimedItems.push({
            name: item.name,
            cost,
            isShared: item.claimedBy.length > 1,
            sharedWith: item.claimedBy.length
          });
        }
      });
      
      totals[person.id] = {
        name: person.name,
        subtotal,
        claimedItems,
        tax: 0,
        tip: 0,
        total: subtotal
      };
    });
    
    // Calculate total subtotal for proportional splits
    const totalSubtotal = Object.values(totals).reduce((sum, p) => sum + p.subtotal, 0);
    
    if (totalSubtotal > 0) {
      sortedPeople.forEach(person => {
        const proportion = totals[person.id].subtotal / totalSubtotal;
        totals[person.id].tax = taxAmount * proportion;
        
        if (tipSplitMethod === 'equal') {
          totals[person.id].tip = tipAmount / sortedPeople.length;
        } else {
          totals[person.id].tip = tipAmount * proportion;
        }
        
        totals[person.id].total = totals[person.id].subtotal + totals[person.id].tax + totals[person.id].tip;
      });
    }
    
    return totals;
  };

  const goToSummary = () => {
    const unclaimed = items.filter(item => item.claimedBy.length === 0).length;
    setUnclaimedCount(unclaimed);
    if (unclaimed > 0) {
      setShowWarning(true);
    } else {
      setShowSummary(true);
    }
  };

  const confirmSummary = () => {
    setShowWarning(false);
    setShowSummary(true);
  };

  const toggleExpanded = (personId) => {
    setExpandedPeople(prev => ({
      ...prev,
      [personId]: !prev[personId]
    }));
  };

  const startNewReceipt = () => {
    setItems([]);
    setPeople([]);
    setTax('');
    setTip('');
    setShowSummary(false);
  };

  const shareTotals = () => {
    const totals = calculateTotals();
    let message = 'Receipt Split:\n\n';
    
    sortedPeople.forEach(person => {
      const total = totals[person.id];
      message += `${total.name}: ${total.total.toFixed(2)}\n`;
    });
    
    const totalAmount = parseFloat(items.reduce((sum, item) => sum + item.price, 0)) + parseFloat(tax || 0) + parseFloat(tip || 0);
    message += `\nTotal: ${totalAmount.toFixed(2)}`;
    
    if (navigator.share) {
      navigator.share({ text: message });
    } else {
      navigator.clipboard.writeText(message);
      alert('Totals copied to clipboard!');
    }
  };

  const sharePersonTotal = (person, amount) => {
    if (!venmoUsername || venmoUsername.trim() === '') {
      setShowVenmoError(true);
      return;
    }

    const venmoLink = `https://venmo.com/${venmoUsername.trim()}?txn=pay&amount=${amount.toFixed(2)}`;
    const message = `Hey ${person.name}! Could you Venmo me ${amount.toFixed(2)} for our receipt split?\n\n${venmoLink}\n\n- Sent via Receipt Splitter`;
    
    if (navigator.share) {
      navigator.share({ 
        text: message,
        title: 'Receipt Split Payment Request'
      }).catch((error) => {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', error);
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(message);
      alert('Payment request copied to clipboard!');
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const preprocessImage = (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Step 1: Edge Detection & Auto-Crop
        let imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const edgeData = detectReceiptEdges(imageDataObj);
        
        if (edgeData) {
          // Crop to detected receipt area
          canvas.width = edgeData.width;
          canvas.height = edgeData.height;
          ctx.putImageData(edgeData, 0, 0);
          imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else {
          // Use full image if edge detection fails
          imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        
        // Step 2: Deskew (straighten image)
        const deskewedData = deskewImage(imageDataObj);
        canvas.width = deskewedData.width;
        canvas.height = deskewedData.height;
        ctx.putImageData(deskewedData, 0, 0);
        
        // Step 3: Convert to grayscale
        imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        
        ctx.putImageData(imageDataObj, 0, 0);
        
        // Step 4: Adaptive thresholding
        imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const thresholded = adaptiveThreshold(imageDataObj);
        ctx.putImageData(thresholded, 0, 0);
        
        // Step 5: Noise removal
        imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const denoised = removeNoise(imageDataObj);
        ctx.putImageData(denoised, 0, 0);
        
        resolve(canvas.toDataURL());
      };
      img.src = imageData;
    });
  };

  const detectReceiptEdges = (imageData) => {
    // Simple edge detection - finds largest rectangular region
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Convert to binary for edge detection
    const binary = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      binary[i / 4] = gray > 128 ? 255 : 0;
    }
    
    // Find bounds (simplified - looks for content edges)
    let minX = width, maxX = 0, minY = height, maxY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (binary[idx] === 0) { // Dark pixel (content)
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Add padding
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);
    
    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;
    
    // Only crop if we found reasonable bounds
    if (cropWidth > width * 0.3 && cropHeight > height * 0.3) {
      const croppedData = new ImageData(cropWidth, cropHeight);
      
      for (let y = 0; y < cropHeight; y++) {
        for (let x = 0; x < cropWidth; x++) {
          const srcIdx = ((minY + y) * width + (minX + x)) * 4;
          const destIdx = (y * cropWidth + x) * 4;
          croppedData.data[destIdx] = data[srcIdx];
          croppedData.data[destIdx + 1] = data[srcIdx + 1];
          croppedData.data[destIdx + 2] = data[srcIdx + 2];
          croppedData.data[destIdx + 3] = data[srcIdx + 3];
        }
      }
      
      return croppedData;
    }
    
    return null; // Use original if detection fails
  };

  const deskewImage = (imageData) => {
    // Simplified deskew - would need full Hough transform for perfect results
    // For now, just return original (complex to implement properly)
    return imageData;
  };

  const adaptiveThreshold = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new ImageData(width, height);
    
    const blockSize = 25; // Size of local region
    const C = 10; // Constant subtracted from mean
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate local mean
        let sum = 0;
        let count = 0;
        
        for (let dy = -blockSize; dy <= blockSize; dy++) {
          for (let dx = -blockSize; dx <= blockSize; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4;
              sum += data[idx];
              count++;
            }
          }
        }
        
        const mean = sum / count;
        const idx = (y * width + x) * 4;
        const pixel = data[idx];
        const threshold = mean - C;
        const value = pixel > threshold ? 255 : 0;
        
        newData.data[idx] = value;
        newData.data[idx + 1] = value;
        newData.data[idx + 2] = value;
        newData.data[idx + 3] = 255;
      }
    }
    
    return newData;
  };

  const removeNoise = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new ImageData(width, height);
    
    // Median filter for noise removal
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const neighbors = [];
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4;
              neighbors.push(data[idx]);
            }
          }
        }
        
        neighbors.sort((a, b) => a - b);
        const median = neighbors[Math.floor(neighbors.length / 2)];
        
        const idx = (y * width + x) * 4;
        newData.data[idx] = median;
        newData.data[idx + 1] = median;
        newData.data[idx + 2] = median;
        newData.data[idx + 3] = 255;
      }
    }
    
    return newData;
  };

  const cleanOcrText = (text) => {
    // Fix common OCR errors
    let cleaned = text;
    
    // Fix $ being read as S or other characters
    cleaned = cleaned.replace(/[S5]\s*(\d+[\.,]\d{2})/gi, '\$$1');
    cleaned = cleaned.replace(/(\d+)[Ss](\d{2})/g, '$1.$2'); // 12S99 → 12.99
    
    // Fix O being read as 0 near numbers
    cleaned = cleaned.replace(/[Oo](?=\d)/g, '0');
    cleaned = cleaned.replace(/(\d)[Oo]/g, '$10');
    
    // Fix l or I being read as 1
    cleaned = cleaned.replace(/[Il|](?=\d)/g, '1');
    
    // Fix common decimal mistakes
    cleaned = cleaned.replace(/(\d+),(\d{2})(?!\d)/g, '$1.$2'); // 12,99 → 12.99
    
    // Remove lines that don't look like receipt items
    const lines = cleaned.split('\n');
    const validLines = lines.filter(line => {
      line = line.trim();
      if (!line) return false;
      
      // Keep lines with price patterns
      if (/\$?\d+\.\d{2}/.test(line)) return true;
      
      // Keep lines with alphabetic text followed by numbers
      if (/[a-zA-Z].+\d/.test(line)) return true;
      
      // Remove very short lines (likely noise)
      if (line.length < 3) return false;
      
      return true;
    });
    
    return validLines.join('\n');
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFileUpload = () => {
    fileInputRef.current?.click();
  };

  const retakePhoto = () => {
    setReceiptImage(null);
    setShowReceiptScanner(true);
  };

  const closeScanner = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setShowReceiptScanner(false);
    setReceiptImage(null);
    setIsProcessing(false);
    setOcrProgress(0);
    setRawOcrText('');
    setOcrError('');
  };

  const cancelProcessing = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsProcessing(false);
    setOcrProgress(0);
  };

  const processReceipt = async () => {
    if (!receiptImage) return;
    
    setIsProcessing(true);
    setOcrProgress(0);
    setOcrError('');
    setProcessingMethod('Veryfi');
    
    try {
      // Try Veryfi first
      const veryfiResult = await processWithVeryfi(receiptImage);
      
      if (veryfiResult && veryfiResult.line_items && veryfiResult.line_items.length > 0) {
        // Veryfi succeeded
        const items = parseVeryfiResponse(veryfiResult);
        const tax = veryfiResult.tax?.toString() || '';
        
        // Add items directly
        const newItems = items.map(item => ({
          id: Date.now() + Math.random(),
          name: item.name,
          price: item.price,
          claimedBy: []
        }));
        
        setItems(prevItems => [...prevItems, ...newItems]);
        
        // Auto-fill tax
        if (tax) {
          setTax(tax);
        }
        
        setIsProcessing(false);
        setShowReceiptScanner(false);
        setReceiptImage(null);
        
        // Track successful receipt scan
        ReactGA.event({
          category: 'User',
          action: 'receipt_scanned',
          label: 'Veryfi Success',
          value: newItems.length
        });
        
      } else {
        // Veryfi failed, fallback to Tesseract
        console.log('Veryfi failed, falling back to Tesseract');
        await processWithTesseract(receiptImage);
      }
      
    } catch (error) {
      console.error('Veryfi Error:', error);
      // Fallback to Tesseract
      await processWithTesseract(receiptImage);
    }
  };

  const processWithVeryfi = async (imageData) => {
    setOcrProgress(25);
    
    // Convert base64 to blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    
    setOcrProgress(50);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob, 'receipt.jpg');
    
    const clientId = import.meta.env.VITE_VERYFI_CLIENT_ID;
    const username = import.meta.env.VITE_VERYFI_USERNAME;
    const apiKey = import.meta.env.VITE_VERYFI_API_KEY;
    
    if (!clientId || !username || !apiKey) {
      throw new Error('Veryfi credentials not configured');
    }
    
    setOcrProgress(75);
    
    // Call Veryfi API
    const veryfiResponse = await fetch('https://api.veryfi.com/api/v8/partner/documents', {
      method: 'POST',
      headers: {
        'CLIENT-ID': clientId,
        'AUTHORIZATION': `apikey ${username}:${apiKey}`,
        'Accept': 'application/json',
      },
      body: formData
    });
    
    setOcrProgress(100);
    
    if (!veryfiResponse.ok) {
      throw new Error('Veryfi API request failed');
    }
    
    return await veryfiResponse.json();
  };

  const parseVeryfiResponse = (veryfiData) => {
    const items = [];
    
    if (veryfiData.line_items && Array.isArray(veryfiData.line_items)) {
      veryfiData.line_items.forEach(item => {
        if (item.description && item.total) {
          items.push({
            name: item.description.trim(),
            price: parseFloat(item.total),
            quantity: item.quantity || 1
          });
        }
      });
    }
    
    return items;
  };

  const processWithTesseract = async (imageData) => {
    setProcessingMethod('Tesseract (fallback)');
    setOcrProgress(0);
    
    try {
      // Preprocess image
      const preprocessedImage = await preprocessImage(imageData);
      
      // Create worker
      workerRef.current = new Worker('/ocr-worker.js');
      
      // Listen for messages from worker
      workerRef.current.onmessage = (e) => {
        const { status, progress, text, error } = e.data;
        
        if (status === 'progress') {
          setOcrProgress(progress);
        } else if (status === 'complete') {
          const cleanedText = cleanOcrText(text);
          setRawOcrText(cleanedText);
          setShowRawText(true);
          setIsProcessing(false);
          workerRef.current.terminate();
          workerRef.current = null;
        } else if (status === 'error') {
          setOcrError(error || 'Failed to process receipt. Please try again or add items manually.');
          setIsProcessing(false);
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };
      
      // Send image to worker
      workerRef.current.postMessage({ image: preprocessedImage });
      
    } catch (error) {
      console.error('Tesseract Error:', error);
      setOcrError('Failed to process receipt. Please try again or add items manually.');
      setIsProcessing(false);
    }
  };

  const continueFromRawText = () => {
    // Phase 3: Parse the raw text and extract items
    const { items, tax } = parseReceiptText(rawOcrText);
    
    if (items.length === 0) {
      // Show error but keep showing the text
      alert('No items found in receipt. Please check the extracted text and add items manually if needed.');
      return;
    }
    
    // Add items to the main list with proper structure
    const newItems = items.map(item => ({
      id: Date.now() + Math.random(),
      name: item.quantity > 1 ? `${item.name} (x${item.quantity})` : item.name,
      price: item.price,
      claimedBy: []
    }));
    
    setItems(prevItems => [...prevItems, ...newItems]);
    
    // Auto-fill tax if extracted
    if (tax) {
      setTax(tax);
    }
    
    setShowRawText(false);
    setReceiptImage(null);
    setShowReceiptScanner(false);
  };

  const parseReceiptText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items = [];
    let taxAmount = '';
    
    for (const line of lines) {
      // Pattern 1: "Item Name $12.99" or "Item Name €12.99" (same line)
      const sameLineMatch = line.match(/^(.+?)\s+([\$€£¥]\s*\d+[\.,]\d{2})$/);
      if (sameLineMatch) {
        const itemName = sameLineMatch[1].trim();
        const price = parsePrice(sameLineMatch[2]);
        
        if (price > 0 && !isNonItemLine(itemName)) {
          const quantity = extractQuantity(itemName);
          const cleanName = removeQuantity(itemName);
          items.push({
            id: Date.now() + Math.random(),
            name: cleanName,
            price,
            quantity
          });
          continue;
        }
      }
      
      // Pattern 2: "Item Name" on one line, "$12.99" on next line
      if (items.length > 0 && line.match(/^[\$€£¥]\s*\d+[\.,]\d{2}$/)) {
        const price = parsePrice(line);
        if (price > 0) {
          items[items.length - 1].price = price;
          continue;
        }
      }
      
      // Check if line is a tax line
      const taxMatch = line.match(/(?:tax|sales tax|tva)\s*[\$€£¥]?\s*(\d+[\.,]\d{2})/i);
      if (taxMatch && !taxAmount) {
        taxAmount = parsePrice(taxMatch[1]);
      }
    }
    
    return { items, tax: taxAmount.toString() };
  };

  const parsePrice = (priceStr) => {
    // Remove currency symbols and spaces
    const cleaned = priceStr.replace(/[\$€£¥\s]/g, '').replace(',', '.');
    return parseFloat(cleaned);
  };

  const extractQuantity = (itemName) => {
    // Look for patterns like "2x Item" or "2 Item"
    const match = itemName.match(/^(\d+)\s*x?\s+/i);
    return match ? parseInt(match[1]) : 1;
  };

  const removeQuantity = (itemName) => {
    // Remove quantity prefix
    return itemName.replace(/^\d+\s*x?\s+/i, '').trim();
  };

  const isNonItemLine = (text) => {
    // Patterns that shouldn't be items
    const nonItemPatterns = [
      /^(sub\s*total|total|tax|sales\s*tax|subtotal|change|cash|paid\s*by|transaction|receipt|thank|business|address|phone|date|time|order|host)/i,
      /^(visa|mastercard|amex|credit|debit|card)/i,
      /^[\d\-]{5,}$/, // Just numbers/dashes (like transaction IDs)
    ];
    
    return nonItemPatterns.some(pattern => pattern.test(text));
  };

  if (showSummary) {
    const totals = calculateTotals();
    const grandTotal = items.reduce((sum, item) => sum + item.price, 0) + parseFloat(tax || 0) + parseFloat(tip || 0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Summary</h1>
          
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-700">Receipt Total: ${grandTotal.toFixed(2)}</p>
          </div>
          
          <div className="space-y-3 mb-6">
            {sortedPeople.map(person => {
              const total = totals[person.id];
              const isExpanded = expandedPeople[person.id];
              
              return (
                <div key={person.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="w-full p-4 flex items-center justify-between bg-white">
                    <span className="font-semibold text-gray-800">{total.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-indigo-600">${total.total.toFixed(2)}</span>
                      <button
                        onClick={() => sharePersonTotal(person, total.total)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Share payment request"
                      >
                        <Share2 size={20} />
                      </button>
                      <button
                        onClick={() => toggleExpanded(person.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-2 mb-3">
                        <p className="font-semibold text-gray-700 mb-2">Items:</p>
                        {total.claimedItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-600">
                              {item.name} {item.isShared && `(split ${item.sharedWith} ways)`}
                            </span>
                            <span className="text-gray-800">${item.cost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-1 pt-3 border-t border-gray-300">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-800">${total.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span className="text-gray-800">${total.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tip:</span>
                          <span className="text-gray-800">${total.tip.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-300">
                          <span className="text-gray-700">Total:</span>
                          <span className="text-indigo-600">${total.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowSummary(false)}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={shareTotals}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Share Totals
            </button>
            <button
              onClick={startNewReceipt}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              New Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Receipt Splitter</h1>
        
        {/* Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-yellow-500" size={32} />
                <h2 className="text-xl font-bold text-gray-800">Warning!</h2>
              </div>
              <p className="text-gray-700 mb-6">
                {unclaimedCount} unclaimed {unclaimedCount === 1 ? 'item' : 'items'}. 
                Continue to summary?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSummary}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Venmo Username Error Modal */}
        {showVenmoError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-red-500" size={32} />
                <h2 className="text-xl font-bold text-gray-800">Venmo Username Required</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Please enter your Venmo username to share payment requests
              </p>
              <input
                type="text"
                placeholder="Your Venmo username"
                value={venmoUsername}
                onChange={(e) => handleVenmoUsernameChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              />
              <button
                onClick={() => setShowVenmoError(false)}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Receipt Scanner Modal */}
        {showReceiptScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Scan Receipt</h2>
                <button
                  onClick={closeScanner}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  <X size={24} />
                </button>
              </div>
              
              {!receiptImage ? (
                <div className="space-y-4">
                  {showScanTips && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-blue-900">Tips for Best Results:</h3>
                        <button
                          onClick={() => setShowScanTips(false)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Place receipt on a flat surface</li>
                        <li>• Ensure good lighting</li>
                        <li>• Avoid shadows</li>
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-gray-600 text-center mb-6">
                    Take a photo or upload an image of your receipt
                  </p>
                  
                  <button
                    onClick={openCamera}
                    className="w-full py-4 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3"
                  >
                    <Camera size={24} />
                    Take Photo
                  </button>
                  
                  <button
                    onClick={openFileUpload}
                    className="w-full py-4 px-6 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-3"
                  >
                    <Upload size={24} />
                    Upload Photo
                  </button>
                  
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={receiptImage}
                      alt="Receipt preview"
                      className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200"
                    />
                  </div>
                  
                  {ocrError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{ocrError}</p>
                    </div>
                  )}
                  
                  {isProcessing ? (
                    <div className="text-center py-4">
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-600 font-medium">Processing with {processingMethod}... {ocrProgress}%</p>
                      <button
                        onClick={cancelProcessing}
                        className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={retakePhoto}
                        className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Retake
                      </button>
                      <button
                        onClick={processReceipt}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Use This Photo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw OCR Text Modal */}
        {showRawText && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Extracted Text (Debug)</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{rawOcrText}</pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRawText(false);
                    setReceiptImage(null);
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={continueFromRawText}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Continue to Parse
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Adjust Percentages Modal */}
        {adjustingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Adjust Split Percentages</h2>
              
              <div className="space-y-4 mb-6">
                {items.find(i => i.id === adjustingItem)?.claimedBy.map(claim => {
                  const person = people.find(p => p.id === claim.personId);
                  return (
                    <div key={claim.personId}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700">{person?.name || 'Unknown'}</span>
                        <span className="text-indigo-600 font-semibold">{percentages[claim.personId]?.toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={percentages[claim.personId] || 0}
                        onChange={(e) => updatePercentage(claim.personId, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setAdjustingItem(null)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={savePercentages}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Add People Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add People</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Person name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPerson()}
              className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={addPerson}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center shrink-0"
              title="Add person"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-2">
            {sortedPeople.map(person => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                {editingPerson === person.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEditPerson()}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded"
                      autoFocus
                    />
                    <button
                      onClick={saveEditPerson}
                      className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-700">{person.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditPerson(person)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deletePerson(person.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Add Items Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Items</h2>
          
          {/* Scan Receipt Button */}
          <button
            onClick={() => setShowReceiptScanner(true)}
            className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            Scan Receipt
          </button>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && itemPrice && addItem()}
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <input
              type="number"
              placeholder="$"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && itemName && addItem()}
              step="0.01"
              className="w-20 shrink-0 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <button
              onClick={addItem}
              className="w-10 h-10 shrink-0 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              title="Add item"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Items</h2>
            <div className="space-y-4">
              {items.map(item => {
                return (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <span className="text-lg font-bold text-indigo-600">${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                        title="Delete item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    {/* Person Chips */}
                    {sortedPeople.length > 0 && (
                      <div className="mb-3">
                        {item.claimedBy.length > 1 && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 italic">
                              (split {item.claimedBy.length} ways)
                            </span>
                            <button
                              onClick={() => openAdjustPercentages(item)}
                              className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                            >
                              Adjust
                            </button>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {sortedPeople.map(person => {
                            const isClaimed = item.claimedBy.some(c => c.personId === person.id);
                            return (
                              <button
                                key={person.id}
                                onClick={() => toggleClaimItem(item.id, person.id)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                  isClaimed
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-indigo-100'
                                }`}
                              >
                                {person.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Claimed by list */}
                    {item.claimedBy.length > 0 && (
                      <div className="mt-3 pl-4 space-y-1 border-t border-gray-200 pt-3">
                        {item.claimedBy.map(claim => {
                          const person = people.find(p => p.id === claim.personId);
                          const cost = calculatePersonCost(item, claim.personId);
                          return (
                            <div key={claim.personId} className="flex justify-between text-sm">
                              <span className="text-gray-600">{person?.name || 'Unknown'}</span>
                              <span className="text-gray-800 font-medium">${cost.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tax and Tip */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tax & Tip</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tip Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tip Split Method</label>
              <select
                value={tipSplitMethod}
                onChange={(e) => setTipSplitMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="proportional">Split Proportionally</option>
                <option value="equal">Split Equally</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Venmo Username <span className="text-xs text-gray-500">(dev feature)</span>
              </label>
              <input
                type="text"
                placeholder="username"
                value={venmoUsername}
                onChange={(e) => handleVenmoUsernameChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* View Summary Button */}
        {items.length > 0 && people.length > 0 && (
          <button
            onClick={goToSummary}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg"
          >
            View Summary
          </button>
        )}
      </div>
    </div>
  );
}