import { AlertCircle, Camera, Edit2, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react'; 
import ReactGA from 'react-ga4';
import SummaryView from './components/SummaryView';
import { HeroTitle } from './components/HeroTitle';
import { SplashScreen } from './components/SplashScreen';
import { LandingHero } from './components/LandingHero'

// ===============================================
// DESIGN TOKENS – tweak global colors here easily
// ===============================================
const COLORS = {
  background: '#0A0A0A',      // Main app background
  textBody: '#EDEDED',        // Soft white body text
  textHeading: '#FFFFFF',     // Pure white headings
  accentPrimary: '#FDF701',   // Highlighter yellow – primary
  accentHover: '#EDE700',     // Slightly darker yellow – hover / secondary
  borderMuted: '#A6A6A6',     // Grey for borders / dividers
  danger: '#FF4A4A',          // Destructive actions (delete)
};

// ==========================
// UI STYLE HELPERS
// ==========================
const primaryButtonClasses =
  "inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold " +
  "transition-colors duration-150"; // Animation timing – change duration here

const chipBaseClasses =
  "px-3 py-1 text-xs font-medium rounded-md border transition-colors duration-150"; // Chip animation timing

const dangerButtonClasses = 
  "inline-flex items-center justify-center px-3 py-1 rounded-md font-semibold " +
  "text-white transition-colors duration-150";

// ==========================
// PAYMENT METHOD ICONS (SVG)
// Simple brand-inspired icons – replace with official SVG paths later if you want
// ==========================
const VenmoIcon = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="4"
      ry="4"
      fill="#3D95CE"
    />
    <path
      d="M10.2 16.5L7.8 7.5h3l0.9 4.5 2.6-4.5h3.1l-4.7 9H10.2z"
      fill="#FFFFFF"
    />
  </svg>
);

const ZelleIcon = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="4"
      ry="4"
      fill="#6C19FF"
    />
    <path
      d="M10 6h5v2.2l-3.2 4.2H15v2H9.1v-2.1l3.1-4.2H10V6z"
      fill="#FFFFFF"
    />
  </svg>
);

const PaypalIcon = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="4"
      ry="4"
      fill="#003087"
    />
    <path
      d="M10 17l1-6.5c.2-1.3 1.1-2.1 2.5-2.1h2.3c1.1 0 1.9.7 1.7 1.9l-.3 2c-.2 1.3-1.1 2.1-2.5 2.1h-1.7l-.3 1.9H10z"
      fill="#FFFFFF"
    />
  </svg>
);

if (import.meta.env.DEV) {
  console.log('Vite env:', import.meta.env);
  console.log('Vite test:', import.meta.env.VITE_TEST_VAR);
  console.log('Veryfi client id:', import.meta.env.VITE_VERYFI_CLIENT_ID);
  console.log('Veryfi username:', import.meta.env.VITE_VERYFI_USERNAME);
  console.log('Veryfi api key:', import.meta.env.VITE_VERYFI_API_KEY);
}

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
  const [receiptScanCount, setReceiptScanCount] = useState(0);
  const [venmoUsername, setVenmoUsername] = useState('');
  const [showVenmoError, setShowVenmoError] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState('');
  const [showScanTips, setShowScanTips] = useState(true);
  const [processingMethod, setProcessingMethod] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [extractedTax, setExtractedTax] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [selectedPayment, setSelectedPayment] = useState('venmo');
  const [paymentHandle, setPaymentHandle] = useState('');

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

  const ocrStatusText = (() => {
    if (!isProcessing) return '';

    if (ocrProgress === 0) return 'Ready to scan';
    if (ocrProgress <= 25) return 'Uploading image';
    if (ocrProgress <= 50) return 'Sending to Veryfi';
    if (ocrProgress < 100) return 'Reading receipt details';
    return 'Done';
  })();

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
          // Person is unclaiming the item
          const remainingClaims = item.claimedBy.filter(c => c.personId !== personId);
  
          // Reset percentages for remaining people so they don't keep stale splits
          const resetClaims = remainingClaims.map(c => ({
            ...c,
            percentage: null,
          }));
  
          return {
            ...item,
            claimedBy: resetClaims,
          };
        } else {
          // New claim starts with no custom percentage yet
          return {
            ...item,
            claimedBy: [...item.claimedBy, { personId, percentage: null }],
          };
        }
      }
      return item;
    }));
  };
  

  const openAdjustPercentages = (item) => {
    const initialPercentages = {};
    const numPeople = item.claimedBy.length;
  
    if (numPeople === 0) return;
  
    const hasSavedPercentages = item.claimedBy.some(
      (claim) => claim.percentage !== null && claim.percentage !== undefined
    );
  
    if (hasSavedPercentages) {
      // Use saved percentages
      item.claimedBy.forEach((claim) => {
        initialPercentages[claim.personId] = claim.percentage;
      });
    } else {
      // First time: show an even split
      const evenSplit = 100 / numPeople;
      item.claimedBy.forEach((claim) => {
        initialPercentages[claim.personId] = evenSplit;
      });
    }
  
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
  
    const numClaimed = item.claimedBy.length;
  
    // If only one person is claiming this item, they owe the full amount
    if (numClaimed === 1) {
      return item.price;
    }
  
    // If we have a saved percentage, use it
    if (claim.percentage !== null && claim.percentage !== undefined) {
      return (item.price * claim.percentage) / 100;
    }
  
    // Otherwise, split evenly among all claimants
    return item.price / numClaimed;
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
        if (import.meta.env.DEV) {
          console.log('Share cancelled or failed:', error);
        }
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
    setShowReceiptScanner(false);
    setReceiptImage(null);
    setIsProcessing(false);
    setOcrProgress(0);
    setRawOcrText('');
    setOcrError('');
  };

  const cancelProcessing = () => {
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
      const veryfiResult = await processWithVeryfi(receiptImage);
  
      if (veryfiResult && veryfiResult.line_items && veryfiResult.line_items.length > 0) {
        const items = parseVeryfiResponse(veryfiResult);
        const tax = veryfiResult.tax?.toString() || '';
  
        const newItems = items.map(item => ({
          id: Date.now() + Math.random(),
          name: item.name,
          price: item.price,
          claimedBy: []
        }));
  
        setItems(prevItems => [...prevItems, ...newItems]);
  
        if (tax) {
          setTax(tax);
        }
  
        // ✅ Increment scan count (see next section)
        setReceiptScanCount(count => count + 1);
  
        setIsProcessing(false);
        setShowReceiptScanner(false);
        setReceiptImage(null);
  
        ReactGA.event({
          category: 'User',
          action: 'receipt_scanned',
          label: 'Veryfi Success',
          value: newItems.length
        });
      } else {
        // No line items from Veryfi
        setOcrError('We couldn’t find any items on this receipt. Try a clearer photo or add items manually.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Veryfi Error:', error);
      setOcrError('We couldn’t read this receipt. Try a clearer photo or add items manually.');
      setIsProcessing(false);
    }
  };
  

  const processWithVeryfi = async (imageData) => {
    setOcrProgress(25);
    setOcrError('');
  
    // imageData should be your data URL string, like "data:image/jpeg;base64,...."
    if (!imageData) {
      throw new Error('No receipt image provided');
    }
  
    setOcrProgress(50);
  
    const baseUrl = import.meta.env.DEV
      ? 'http://localhost:5174'
      : ''; // on Vercel, same origin

    const response = await fetch(`${baseUrl}/api/veryfi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_data: imageData,
      }),
    });
  
    setOcrProgress(100);
  
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Veryfi proxy error:', errData);
      throw new Error('Veryfi API request failed');
    }
  
    const data = await response.json();
    if (import.meta.env.DEV) {
      console.log('Veryfi raw response:', data);
    }
    return data;
    
  };
  
  

  const parseVeryfiResponse = (veryfiData) => {
    const items = [];
  
    if (Array.isArray(veryfiData.line_items)) {
      veryfiData.line_items.forEach((item) => {
        if (!item.description || item.total == null) return;
  
        const rawName = item.description.trim();
        const qty = item.quantity && item.quantity > 1 ? item.quantity : 1;
  
        const name =
          qty > 1
            ? `x${qty} ${rawName}`
            : rawName;
  
        items.push({
          name, 
          // Veryfi's `total` is the total price for this line (includes quantity)
          price: Number(item.total),
          quantity: qty,
        });
      });
    }
  
    return items;
  };


  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Quick splash — adjust ms if you want it shorter/longer
    const timer = setTimeout(() => setShowSplash(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  if (showSummary) {
    return (
      <SummaryView
        items={items}
        tax={tax}
        tip={tip}
        sortedPeople={sortedPeople}
        expandedPeople={expandedPeople}
        calculateTotals={calculateTotals}
        onToggleExpanded={toggleExpanded}
        onSharePersonTotal={sharePersonTotal}
        onBack={() => setShowSummary(false)}
        onShareTotals={shareTotals}
        onStartNewReceipt={startNewReceipt}
      />
    );
  }

  return (
      <>
        <SplashScreen
          visible={showSplash}
          appName="Receipt Splitter"
          tagline="Split the bill. Skip the hassle."
        />
      {/* 
        <LandingHero
          onScanClick={() => setShowReceiptScanner(true)}
          colors={{
            heading: COLORS.textHeading,
            body: COLORS.textBody,
            accent: COLORS.accentPrimary,
          }}
        /> */}
  
        <div
          className={`min-h-screen p-4 pb-24 transition-opacity duration-300 ${
            showSplash ? 'opacity-100 pointer-events-none' : 'opacity-100'
          }`}
          style={{ backgroundColor: COLORS.background }}
        >
        <div className="max-w-2xl mx-auto">
        <HeroTitle
          title="Receipt Splitter"
          subtitle="Split the bill. Skip the hassle."
          colors={{
            heading: COLORS.textHeading,
            body: COLORS.textBody,
          }}
        />
          {/* Warning Modal */}
          {showWarning && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div
                className="rounded-md p-6 max-w-sm w-full"
                style={{
                  backgroundColor: COLORS.background,
                  border: `0.5px solid ${COLORS.accentPrimary}`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle
                    size={32}
                    style={{ color: COLORS.accentPrimary }}
                  />
                  <h2
                    className="text-xl font-bold"
                    style={{ color: COLORS.textHeading }}
                  >
                    Warning
                  </h2>
                </div>

                <p
                  className="mb-6 text-sm"
                  style={{ color: COLORS.textBody }}
                >
                  {unclaimedCount} unclaimed{' '}
                  {unclaimedCount === 1 ? 'item' : 'items'}. Continue to
                  summary anyway?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="flex-1 py-2 px-4 rounded-md font-semibold transition-colors duration-150"
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${COLORS.borderMuted}`,
                      color: COLORS.textBody,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.accentPrimary;
                      e.currentTarget.style.color = COLORS.accentPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderMuted;
                      e.currentTarget.style.color = COLORS.textBody;
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSummary}
                    className={primaryButtonClasses + ' flex-1 py-2 px-4'}
                    style={{
                      backgroundColor: COLORS.accentPrimary,
                      color: '#000000',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.accentHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Receipt Scanner Modal */}
        {showReceiptScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-md p-6 max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto"
              style={{
                backgroundColor: COLORS.background,
                border: `0.5px solid ${COLORS.accentPrimary}`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-bold"
                  style={{ color: COLORS.textHeading }}
                >
                  Scan Receipt
                </h2>
                <button
                  onClick={closeScanner}
                  className="p-2 rounded-md transition-colors duration-150"
                  style={{
                    color: COLORS.textBody,
                    border: `1px solid ${COLORS.borderMuted}40`,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.borderColor = COLORS.accentPrimary;
                      e.currentTarget.style.color = COLORS.accentPrimary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${COLORS.borderMuted}40`;
                    e.currentTarget.style.color = COLORS.textBody;
                  }}
                  disabled={isProcessing}
                >
                  <X size={18} />
                </button>
              </div>

              {!receiptImage ? (
                <div className="space-y-4">
                  <p
                    className="text-center mb-6 text-sm"
                    style={{ color: COLORS.textBody, opacity: 0.8 }}
                  >
                    Take a photo or upload an image of your receipt.
                  </p>

                  <button
                    onClick={openCamera}
                    className={
                      primaryButtonClasses +
                      ' w-full py-3 px-6 flex items-center justify-center gap-3'
                    }
                    style={{
                      backgroundColor: COLORS.accentPrimary,
                      color: '#000000',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.accentHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
                    }}
                  >
                    <Camera size={20} />
                    <span className="uppercase tracking-wide text-xs">
                      Take Photo
                    </span>
                  </button>

                  <button
                    onClick={openFileUpload}
                    className="w-full py-3 px-6 rounded-md font-semibold transition-colors duration-150 flex items-center justify-center gap-3"
                    style={{
                      backgroundColor: '#111111',
                      color: COLORS.textBody,
                      border: `1px solid ${COLORS.borderMuted}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.accentPrimary;
                      e.currentTarget.style.color = COLORS.accentPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderMuted;
                      e.currentTarget.style.color = COLORS.textBody;
                    }}
                  >
                    <Upload size={20} />
                    <span className="uppercase tracking-wide text-xs">
                      Upload Photo
                    </span>
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
                      className="w-full max-h-96 object-contain rounded-md"
                      style={{
                        border: `1px solid ${COLORS.borderMuted}`,
                      }}
                    />
                  </div>

                  {ocrError && (
                    <div
                      className="rounded-md p-4"
                      style={{
                        backgroundColor: '#2A0000',
                        border: `0.5px solid ${COLORS.danger}`,
                      }}
                    >
                      <p
                        className="text-sm"
                        style={{ color: COLORS.danger }}
                      >
                        {ocrError}
                      </p>
                    </div>
                  )}

                  {isProcessing ? (
                    <div className="text-center py-4">
                      <div
                        className="w-full h-2 rounded-full mb-3"
                        style={{ backgroundColor: '#222222' }}
                      >
                        <div
                          // Animation timing – adjust duration here if you want faster/slower motion
                          className="h-2 rounded-full transition-all duration-150"
                          style={{
                            width: `${ocrProgress}%`,
                            backgroundColor: COLORS.accentPrimary,
                          }}
                        />
                      </div>

                      <p
                        className="font-medium text-sm"
                        style={{ color: COLORS.textBody }}
                      >
                        {ocrStatusText
                          ? `${ocrStatusText} (${processingMethod || 'Veryfi'})... ${ocrProgress}%`
                          : `Processing with ${processingMethod || 'Veryfi'}... ${ocrProgress}%`}
                      </p>
                      <button
                        onClick={cancelProcessing}
                        className="mt-4 text-xs underline"
                        style={{ color: COLORS.textBody, opacity: 0.8 }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={retakePhoto}
                        className="flex-1 py-3 px-4 rounded-md font-semibold transition-colors duration-150"
                        style={{
                          backgroundColor: '#111111',
                          color: COLORS.textBody,
                          border: `1px solid ${COLORS.borderMuted}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.accentPrimary;
                          e.currentTarget.style.color = COLORS.accentPrimary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = COLORS.borderMuted;
                          e.currentTarget.style.color = COLORS.textBody;
                        }}
                      >
                        Retake
                      </button>
                      <button
                        onClick={processReceipt}
                        className={primaryButtonClasses + ' flex-1 py-3 px-4'}
                        style={{
                          backgroundColor: COLORS.accentPrimary,
                          color: '#000000',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.accentHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.accentPrimary;
                        }}
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
        {/* Adjust Percentages Modal */}
        {adjustingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-md p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              style={{
                backgroundColor: COLORS.background,
                border: `1px solid ${COLORS.accentPrimary}`,
              }}
            >
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: COLORS.textHeading }}
              >
                Adjust Split Percentages
              </h2>

              <div className="space-y-4 mb-6">
                {items
                  .find((i) => i.id === adjustingItem)
                  ?.claimedBy.map((claim) => {
                    const person = people.find((p) => p.id === claim.personId);
                    const pct = percentages[claim.personId] ?? 0;

                    return (
                      <div key={claim.personId}>
                        <div className="flex justify-between mb-1">
                          <span
                            className="font-medium text-sm"
                            style={{ color: COLORS.textBody }}
                          >
                            {person?.name || 'Unknown'}
                          </span>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: COLORS.accentPrimary }}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.1"
                          value={pct}
                          onChange={(e) =>
                            updatePercentage(
                              claim.personId,
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full"
                          style={{
                            accentColor: COLORS.accentPrimary,
                          }}
                        />
                      </div>
                    );
                  })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAdjustingItem(null)}
                  className="flex-1 py-2 px-4 rounded-md font-semibold transition-colors duration-150"
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${COLORS.borderMuted}`,
                    color: COLORS.textBody,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.accentPrimary;
                    e.currentTarget.style.color = COLORS.accentPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderMuted;
                    e.currentTarget.style.color = COLORS.textBody;
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={savePercentages}
                  className={primaryButtonClasses + ' flex-1 py-2 px-4'}
                  style={{
                    backgroundColor: COLORS.accentPrimary,
                    color: '#000000',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.accentHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Add People Section */}
        <div
          // Content Cards – change border color here if you want grey instead of yellow
          className="rounded-md mb-6"
          style={{
            backgroundColor: COLORS.background,
            // border: `.5px solid ${COLORS.accentPrimary}`,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4 flex items-center gap-2"
            style={{ color: COLORS.textHeading }}
          >
            <span
              className="material-symbols-outlined flex items-center justify-center text-[22px]"
              style={{ color: COLORS.textHeading, lineHeight: '1' }}
            >
              person_add
            </span>
            Add People
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Person name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPerson()}
              className="flex-1 min-w-0 px-3 py-2 rounded-md text-sm focus:outline-none"
              style={{
                backgroundColor: '#111111',
                border: `1px solid ${COLORS.borderMuted}`,
                color: COLORS.textBody,
              }}
            />
            {/* <button
              onClick={addPerson}
              className={primaryButtonClasses + 'w-10 h-10 flex items-center justify-center'}
              style={{
                backgroundColor: COLORS.accentPrimary,
                color: '#000000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
              }}
            >
              <Plus size={18} />
            </button> */}

            <button
              onClick={addItem}
              className={
                primaryButtonClasses +
                ' w-10 h-10 shrink-0 flex items-center justify-center'
              }
              title="Add item"
              style={{
                backgroundColor: COLORS.accentPrimary,
                color: '#000000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
              }}
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="mt-2 ml-4">
            {sortedPeople.map((person, index) => (
              <div
                key={person.id}
                className="flex items-center justify-between py-2"
                style={{
                  borderBottom:
                    index === sortedPeople.length - 1
                      ? 'none'
                      : `1px solid ${COLORS.borderMuted}40`, // divider between people
                }} 
              >
                {editingPerson === person.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEditPerson()}
                      className="flex-1 px-3 py-1 rounded-md text-sm focus:outline-none"
                      autoFocus
                      style={{
                        backgroundColor: '#111111',
                        border: `1px solid ${COLORS.borderMuted}`,
                        color: COLORS.textBody,
                      }}
                    />
                    <button
                      onClick={saveEditPerson}
                      className={primaryButtonClasses + ' ml-2 px-3 py-1 text-sm'}
                      style={{
                        backgroundColor: COLORS.accentPrimary,
                        color: '#000000',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.accentHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
                      }}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="font-medium"
                      style={{ color: COLORS.textBody }}
                    >
                      {person.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditPerson(person)}
                        className="p-2 rounded-md transition-colors duration-150"
                        style={{
                          color: COLORS.textBody,
                          border: `1px solid ${COLORS.borderMuted}40`,
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.accentPrimary;
                          e.currentTarget.style.color = COLORS.accentPrimary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${COLORS.borderMuted}40`;
                          e.currentTarget.style.color = COLORS.textBody;
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deletePerson(person.id)}
                        className="p-2 rounded-md transition-colors duration-150"
                        style={{
                          backgroundColor: COLORS.danger,
                          color: '#FFFFFF',
                          border: `1px solid ${COLORS.danger}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = 0.9;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = 1;
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>       
        {/* Add Items Section */}
        <div
          // Content Cards – change border color here if you want grey instead of yellow
          className="rounded-md mb-6"
          style={{
            backgroundColor: COLORS.background,
            // border: `.5px solid ${COLORS.accentPrimary}`,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4 flex items-center gap-2"
            style={{ color: COLORS.textHeading }}
          >
            <span
              className="material-symbols-outlined flex items-center justify-center text-[22px]"
              style={{ color: COLORS.textHeading, lineHeight: '1' }}
            >
              restaurant
            </span>
            Add Items
          </h2>

          <button
            onClick={() => setShowReceiptScanner(true)}
            className={
              primaryButtonClasses +
              ' w-full py-3 mb-4 text-sm flex items-center justify-center gap-2'
            }
            style={{
              backgroundColor: COLORS.accentPrimary,
              color: '#000000',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
            }}
          >
            <Camera size={18} />
            <span className="uppercase tracking-wide text-xs">Scan Receipt</span>
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && itemPrice && addItem()}
              className="flex-1 min-w-0 px-3 py-2 rounded-md text-sm focus:outline-none"
              style={{
                backgroundColor: '#111111',
                border: `1px solid ${COLORS.borderMuted}`,
                color: COLORS.textBody,
              }}
            />
            <input
              type="number"
              placeholder="$"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && itemName && addItem()}
              step="0.01"
              className="w-20 shrink-0 px-2 py-2 rounded-md text-sm text-right focus:outline-none"
              style={{
                backgroundColor: '#111111',
                border: `1px solid ${COLORS.borderMuted}`,
                color: COLORS.textBody,
              }}
            />

            <button
              onClick={addItem}
              className={
                primaryButtonClasses +
                ' w-10 h-10 shrink-0 flex items-center justify-center'
              }
              title="Add item"
              style={{
                backgroundColor: COLORS.accentPrimary,
                color: '#000000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
              }}
            >
              <Plus size={32} />
            </button>
            
          </div>
        </div>

        {/* Items Micro-Label — edit/remove here */}
        {items.length > 0 && (
          <>
            <p
              className="text-[11px] tracking-[0.18em] mb-2"
              style={{ color: COLORS.textBody, opacity: 0.7 }}
            >
              ITEMS
            </p>

            {/* Content Cards – change border color here if you want grey instead of yellow */}
            <div className="space-y-2 pb-4 mb-6">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-md p-4"
                  style={{
                    backgroundColor: COLORS.background,
                    border: `.5px solid ${COLORS.accentPrimary}`,
                  }}
                >
                  {/* Item Header Row */}
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <span
                      className="font-semibold"
                      style={{ color: COLORS.textBody }}
                    >
                      {item.name}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Bigger price, in yellow */}
                      <span
                        className="text-base font-bold"
                        style={{ color: COLORS.accentPrimary }}
                      >
                        ${item.price.toFixed(2)}
                      </span>

                      {/* Edit / Delete – same style as Add People section */}
                      <button
                        onClick={() => startEditItem(item)}
                        className="p-2 rounded-md transition-colors duration-150"
                        style={{
                          color: COLORS.textBody,
                          border: `1px solid ${COLORS.borderMuted}40`,
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.accentPrimary;
                          e.currentTarget.style.color = COLORS.accentPrimary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${COLORS.borderMuted}40`;
                          e.currentTarget.style.color = COLORS.textBody;
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 rounded-md transition-colors duration-150"
                        style={{
                          backgroundColor: COLORS.danger,
                          color: '#FFFFFF',
                          border: `1px solid ${COLORS.danger}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = 0.9;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = 1;
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* People chips for this item + Adjust button */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-2">
                      {sortedPeople.length === 0 ? (
                        <p
                          className="text-xs"
                          style={{ color: COLORS.textBody, opacity: 0.6 }}
                        >
                          Add people to assign this item.
                        </p>
                      ) : (
                        sortedPeople.map((person) => {
                          const isSelected = item.claimedBy.some(
                            (c) => c.personId === person.id
                          );

                          // New chip styling:
                          // - Default: subtle bordered pill, dark bg, soft white text
                          // - Hover: yellow border/text
                          // - Selected: filled yellow with black text
                          return (
                            <button
                              key={person.id}
                              onClick={() => toggleClaimItem(item.id, person.id)}
                              className={chipBaseClasses}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: COLORS.accentPrimary,
                                      color: '#000000',
                                      borderColor: COLORS.accentPrimary,
                                    }
                                  : {
                                      backgroundColor: '#111111',
                                      color: COLORS.textBody,
                                      borderColor: `${COLORS.borderMuted}80`,
                                    }
                              }
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor =
                                    COLORS.accentPrimary;
                                  e.currentTarget.style.color = COLORS.accentPrimary;
                                  e.currentTarget.style.backgroundColor = '#151515';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor =
                                    `${COLORS.borderMuted}80`;
                                  e.currentTarget.style.color = COLORS.textBody;
                                  e.currentTarget.style.backgroundColor = '#111111';
                                }
                              }}
                            >
                              {person.name}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Adjust button – only when 2+ people claimed this item */}
                    {item.claimedBy.length > 1 && (
                      <button
                      onClick={() => openAdjustPercentages(item)}
                      className="px-3 py-1 rounded-md text-xs font-semibold transition-colors duration-150"
                      style={{
                        backgroundColor: 'transparent',
                        border: `0.5px solid ${COLORS.borderMuted}`,
                        color: COLORS.textBody,
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = COLORS.accentPrimary;
                        e.currentTarget.style.color = COLORS.accentPrimary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = COLORS.borderMuted;
                        e.currentTarget.style.color = COLORS.textBody;
                      }}
                    >
                      Adjust
                    </button>
                    
                    )}
                  </div>

                  {/* Shared info row */}
                  <div
                    className="pt-2 mt-2"
                    style={{
                      borderTop: `1px solid ${COLORS.borderMuted}40`, // 40 = ~25% opacity
                    }}
                  >
                    {item.claimedBy.length > 0 ? (
                      <div className="space-y-1 ml-2">
                        {item.claimedBy.map((claim) => {
                          const person = people.find((p) => p.id === claim.personId);

                          const numClaimed = item.claimedBy.length;
                          const pct =
                            claim.percentage !== null &&
                            claim.percentage !== undefined
                              ? claim.percentage
                              : 100 / numClaimed;

                          const share = item.price * (pct / 100);

                          return (
                            <div
                              key={claim.personId}
                              className="flex justify-between text-xs"
                            >
                              <span
                                style={{
                                  color: COLORS.textBody,
                                }}
                              >
                                {person?.name || 'Unknown'}
                              </span>
                              <span
                                className="font-semibold"
                                style={{
                                  color: COLORS.accentPrimary,
                                }}
                              >
                                ${share.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span />
                    )}
                  </div>

                </div>
              ))}
            </div>
          </>
        )}



      {/* ---- Tax & Tip Section ---- */}
      <div
        className="rounded-md mb-6"
        style={{
          backgroundColor: COLORS.background,
        }}
      >
        <h2
          className="text-xl font-semibold mb-4 flex items-center gap-2"
          style={{ color: COLORS.textHeading }}
        >
          <span
            className="material-symbols-outlined text-[22px] flex items-center"
            style={{ color: COLORS.textHeading }}
          >
            attach_money
          </span>
          Tax &amp; Tip
        </h2>

        <div className="space-y-6">

          {/* --- TAX --- */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textBody }}
            >
              Tax Amount
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={tax}
              onChange={e => setTax(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
              style={{
                backgroundColor: '#111111',
                border: `1px solid ${
                  tax ? COLORS.accentPrimary : COLORS.borderMuted
                }`,
                color: COLORS.textBody,
              }}
            />
          </div>

          {/* --- TIP AMOUNT + PRESET BUTTONS --- */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textBody }}
            >
              Tip Amount
            </label>

            {/* % Buttons */}
            <div className="flex gap-2 mb-3">
              {[15, 20, 25].map(pct => (
                <button
                  key={pct}
                  onClick={() => {
                    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
                    const newTip = ((subtotal * pct) / 100).toFixed(2);
                    setTip(newTip);
                  }}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                  style={{
                    border: `1px solid ${
                      parseFloat(tip || 0) > 0 &&
                      Math.abs((tip / items.reduce((s, i) => s + i.price, 0)) * 100 - pct) < 1
                        ? COLORS.accentPrimary
                        : COLORS.borderMuted
                    }`,
                    color: COLORS.textBody,
                    backgroundColor: '#111111',
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="0.00"
              value={tip}
              onChange={e => setTip(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
              style={{
                backgroundColor: '#111111',
                border: `1px solid ${
                  tip ? COLORS.accentPrimary : COLORS.borderMuted
                }`,
                color: COLORS.textBody,
              }}
            />
          </div>

          {/* --- TIP SPLIT METHOD --- */}
<div>
  <label
    className="block text-sm font-medium mb-2"
    style={{ color: COLORS.textBody }}
  >
    Tip Split Method
  </label>

  <div
    className="relative"
    style={{
      border: `1px solid ${
        tipSplitMethod ? COLORS.accentPrimary : COLORS.borderMuted
      }`,
      borderRadius: '6px', // same rounded-md look
    }}
  >
    <select
      value={tipSplitMethod}
      onChange={e => setTipSplitMethod(e.target.value)}
      className="w-full px-3 py-2 pr-8 rounded-md text-sm appearance-none focus:outline-none"
      style={{
        backgroundColor: '#111111',
        color: COLORS.textBody,
      }}
    >
      <option value="proportional">Split Proportionally</option>
      <option value="equal">Split Equally</option>
    </select>

    {/* Custom dropdown arrow */}
    <span
      className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[18px]"
      style={{ color: COLORS.textBody }}
    >
      expand_more
    </span>
  </div>
</div>


          {/* --- PAYMENT METHOD SELECTOR --- */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textBody }}
            >
              Payment Method
            </label>

            <div className="flex gap-3 mb-3 items-center">

              {/* Venmo */}
              <button
                onClick={() => setSelectedPayment('venmo')}
                className="p-2 rounded-md flex items-center justify-center transition-colors"
                style={{
                  border: `1px solid ${
                    selectedPayment === 'venmo'
                      ? COLORS.accentPrimary
                      : COLORS.borderMuted
                  }`,
                  backgroundColor:
                    selectedPayment === 'venmo' ? '#111111' : 'transparent',
                }}
              >
                <VenmoIcon className="w-5 h-5" />
              </button>

              {/* Zelle */}
              <button
                onClick={() => setSelectedPayment('zelle')}
                className="p-2 rounded-md flex items-center justify-center transition-colors"
                style={{
                  border: `1px solid ${
                    selectedPayment === 'zelle'
                      ? COLORS.accentPrimary
                      : COLORS.borderMuted
                  }`,
                  backgroundColor:
                    selectedPayment === 'zelle' ? '#111111' : 'transparent',
                }}
              >
                <ZelleIcon className="w-5 h-5" />
              </button>

              {/* PayPal */}
              <button
                onClick={() => setSelectedPayment('paypal')}
                className="p-2 rounded-md flex items-center justify-center transition-colors"
                style={{
                  border: `1px solid ${
                    selectedPayment === 'paypal'
                      ? COLORS.accentPrimary
                      : COLORS.borderMuted
                  }`,
                  backgroundColor:
                    selectedPayment === 'paypal' ? '#111111' : 'transparent',
                }}
              >
                <PaypalIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Username Input */}
            {selectedPayment && (
              <input
                type="text"
                placeholder={`Your ${selectedPayment} username`}
                value={paymentHandle}
                onChange={e => {
                  const value = e.target.value;
                  setPaymentHandle(value);

                  // keep your existing Venmo username logic working:
                  if (selectedPayment === 'venmo') {
                    handleVenmoUsernameChange(value);
                  }
                }}
                className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                style={{
                  backgroundColor: '#111111',
                  border: `1px solid ${
                    paymentHandle ? COLORS.accentPrimary : COLORS.borderMuted
                  }`,
                  color: COLORS.textBody,
                }}
              />
            )}
          </div>
        </div>
      </div>



        {/* View Summary Button */}
        {items.length > 0 && people.length > 0 && (
          <button
          onClick={goToSummary}
          className={primaryButtonClasses + " w-full py-4 text-lg"}
          style={{
            backgroundColor: COLORS.accentPrimary,
            color: '#000000',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = COLORS.accentHover;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = COLORS.accentPrimary;
          }}
        >
          View Summary
        </button>
          
        )}
      </div>
    </div>
    </>
  );
}