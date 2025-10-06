import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, AlertCircle, Share2 } from 'lucide-react';

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
  const [venmoUsername, setVenmoUsername] = useState('');
  const [showVenmoError, setShowVenmoError] = useState(false);

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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={addPerson}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Add
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && itemPrice && addItem()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Price"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && itemName && addItem()}
              step="0.01"
              className="w-28 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={addItem}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Add
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