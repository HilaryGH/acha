import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface PartnerPaymentRecordFormProps {
  partnerId: string;
  role: string;
  orderId?: string; // Optional: link payment to specific order
  order?: any; // Optional: order details for auto-calculation
  existingTransactionId?: string; // Optional: ID of existing transaction to edit
  onPaymentRecorded?: () => void; // Callback after successful submission
}

interface PaymentEntry {
  quantity: string; // Can be number or range
  rate: string;
}

function PartnerPaymentRecordForm({ partnerId, role, orderId, order, existingTransactionId, onPaymentRecorded }: PartnerPaymentRecordFormProps) {
  const [pieceEntries, setPieceEntries] = useState<PaymentEntry[]>([{ quantity: '', rate: '' }]);
  const [weightEntries, setWeightEntries] = useState<PaymentEntry[]>([{ quantity: '', rate: '' }]);
  const [distanceEntries, setDistanceEntries] = useState<PaymentEntry[]>([{ quantity: '', rate: '' }]);
  
  // Common fields
  const [extraFees, setExtraFees] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Helper functions to add/remove entries
  const addPieceEntry = () => {
    setPieceEntries(prev => [...prev, { quantity: '', rate: '' }]);
  };

  const removePieceEntry = (index: number) => {
    if (pieceEntries.length > 1) {
      setPieceEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updatePieceEntry = (index: number, field: 'quantity' | 'rate', value: string) => {
    setPieceEntries(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  };

  const addWeightEntry = () => {
    setWeightEntries(prev => [...prev, { quantity: '', rate: '' }]);
  };

  const removeWeightEntry = (index: number) => {
    if (weightEntries.length > 1) {
      setWeightEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateWeightEntry = (index: number, field: 'quantity' | 'rate', value: string) => {
    setWeightEntries(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  };

  const addDistanceEntry = () => {
    setDistanceEntries(prev => [...prev, { quantity: '', rate: '' }]);
  };

  const removeDistanceEntry = (index: number) => {
    if (distanceEntries.length > 1) {
      setDistanceEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateDistanceEntry = (index: number, field: 'quantity' | 'rate', value: string) => {
    setDistanceEntries(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  };

  // Load existing transaction if editing
  useEffect(() => {
    if (existingTransactionId) {
      loadExistingTransaction();
    }
  }, [existingTransactionId]);

  // Auto-calculate from order details when order is selected
  useEffect(() => {
    if (order && !existingTransactionId) {
      autoCalculateFromOrder();
    }
  }, [order, existingTransactionId]);

  const loadExistingTransaction = async () => {
    if (!existingTransactionId) return;
    
    try {
      setLoadingExisting(true);
      const response = await api.transactions.getById(existingTransactionId) as { status?: string; data?: any };
      
      if (response.status === 'success' && response.data) {
        const transaction = response.data;
        const details = transaction.paymentDetails || {};
        
        // Load entries (for now, convert single values to entries)
        if (details.numberOfPieces || details.numberOfPiecesInput) {
          setPieceEntries([{
            quantity: details.numberOfPiecesInput || details.numberOfPieces?.toString() || '',
            rate: details.ratePerPiece?.toString() || ''
          }]);
        }
        if (details.weightKg || details.weightKgInput) {
          setWeightEntries([{
            quantity: details.weightKgInput || details.weightKg?.toString() || '',
            rate: details.ratePerKg?.toString() || ''
          }]);
        }
        if (details.distanceKm || details.distanceKmInput) {
          setDistanceEntries([{
            quantity: details.distanceKmInput || details.distanceKm?.toString() || '',
            rate: details.ratePerKm?.toString() || ''
          }]);
        }
        
        setExtraFees(details.extraFees?.toString() || '');
        setNotes(details.notes || '');
        setIsEditMode(true);
      }
    } catch (error: any) {
      console.error('Error loading existing transaction:', error);
      setMessage({ type: 'error', text: 'Failed to load existing payment record.' });
    } finally {
      setLoadingExisting(false);
    }
  };

  const autoCalculateFromOrder = () => {
    if (!order) return;
    
    const orderInfo = order.orderInfo || {};
    
    // Auto-fill from order info
    if (orderInfo.quantityType === 'pieces' || orderInfo.quantityDescription?.toLowerCase().includes('piece')) {
      const quantity = parseFloat(orderInfo.quantityDescription?.match(/\d+/)?.[0] || '0');
      if (quantity > 0) {
        setPieceEntries([{ quantity: quantity.toString(), rate: '' }]);
      }
    }
    if (orderInfo.quantityType === 'weight' || orderInfo.quantityDescription?.toLowerCase().includes('kg') || orderInfo.quantityDescription?.toLowerCase().includes('kilogram')) {
      const weight = parseFloat(orderInfo.quantityDescription?.match(/[\d.]+/)?.[0] || '0');
      if (weight > 0) {
        setWeightEntries([{ quantity: weight.toString(), rate: '' }]);
      }
    }
  };

  // Parse range input (e.g., "10-20", "10 to 20", "10 - 20", or single number)
  const parseRange = (value: string): { min: number; max: number; average: number; isRange: boolean } => {
    if (!value || value.trim() === '') {
      return { min: 0, max: 0, average: 0, isRange: false };
    }
    
    // Try to parse as range (supports: "10-20", "10 to 20", "10 - 20", "10–20")
    const rangeMatch = value.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to|TO)\s*(\d+(?:\.\d+)?)/i);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      if (!isNaN(min) && !isNaN(max) && min <= max) {
        return { min, max, average: (min + max) / 2, isRange: true };
      }
    }
    
    // Try to parse as single number
    const single = parseFloat(value);
    if (!isNaN(single)) {
      return { min: single, max: single, average: single, isRange: false };
    }
    
    return { min: 0, max: 0, average: 0, isRange: false };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation - Only ONE payment basis should be filled
    const hasPieces = pieceEntries.some(entry => {
      const range = parseRange(entry.quantity);
      return range.average > 0 && parseFloat(entry.rate) > 0;
    });
    
    const hasWeight = weightEntries.some(entry => {
      const range = parseRange(entry.quantity);
      return range.average > 0 && parseFloat(entry.rate) > 0;
    });
    
    const hasDistance = distanceEntries.some(entry => {
      const range = parseRange(entry.quantity);
      return range.average > 0 && parseFloat(entry.rate) > 0;
    });

    const filledBases = [hasPieces, hasWeight, hasDistance].filter(Boolean).length;

    if (filledBases === 0) {
      setMessage({ type: 'error', text: 'Please fill at least one payment basis (Piece, Weight, or Distance) with valid values.' });
      return;
    }

    if (filledBases > 1) {
      setMessage({ type: 'error', text: 'Please fill only ONE payment basis (either Piece, Weight, or Distance). Delivery payment is calculated based on one method, not all three.' });
      return;
    }

    // Validate entries for the selected payment basis
    let isValid = true;
    let errorMessage = '';

    if (hasPieces) {
      for (const entry of pieceEntries) {
        const range = parseRange(entry.quantity);
        if (range.average > 0 && (!entry.rate || parseFloat(entry.rate) <= 0)) {
          isValid = false;
          errorMessage = 'Please enter a valid rate for all piece entries.';
          break;
        }
        if (entry.rate && parseFloat(entry.rate) > 0 && range.average <= 0) {
          isValid = false;
          errorMessage = 'Please enter a valid quantity or range for all piece entries.';
          break;
        }
      }
    } else if (hasWeight) {
      for (const entry of weightEntries) {
        const range = parseRange(entry.quantity);
        if (range.average > 0 && (!entry.rate || parseFloat(entry.rate) <= 0)) {
          isValid = false;
          errorMessage = 'Please enter a valid rate for all weight entries.';
          break;
        }
        if (entry.rate && parseFloat(entry.rate) > 0 && range.average <= 0) {
          isValid = false;
          errorMessage = 'Please enter a valid weight or range for all weight entries.';
          break;
        }
      }
    } else if (hasDistance) {
      for (const entry of distanceEntries) {
        const range = parseRange(entry.quantity);
        if (range.average > 0 && (!entry.rate || parseFloat(entry.rate) <= 0)) {
          isValid = false;
          errorMessage = 'Please enter a valid rate for all distance entries.';
          break;
        }
        if (entry.rate && parseFloat(entry.rate) > 0 && range.average <= 0) {
          isValid = false;
          errorMessage = 'Please enter a valid distance or range for all distance entries.';
          break;
        }
      }
    }

    // Validate extra fees (optional but must be >= 0 if provided)
    if (extraFees !== '' && parseFloat(extraFees) < 0) {
      isValid = false;
      errorMessage = 'Extra fees cannot be negative. Enter 0 or leave empty if there are no extra fees.';
    }

    if (!isValid) {
      setMessage({ type: 'error', text: errorMessage });
      return;
    }

    try {
      setLoading(true);

      // Prepare payment details based on which basis is used
      let paymentDetails: any = {
        paymentBasis: hasPieces ? 'piece' : hasWeight ? 'weight' : 'distance',
        role,
        extraFees: extraFees ? parseFloat(extraFees) : 0,
        notes: notes ? notes.trim() : '',
      };

      if (hasPieces) {
        paymentDetails.pieceEntries = pieceEntries.map(entry => {
          const range = parseRange(entry.quantity);
          const rate = parseFloat(entry.rate) || 0;
          return {
            quantity: entry.quantity,
            quantityRange: range.isRange ? { min: range.min, max: range.max } : null,
            averageQuantity: range.average,
            rate: rate,
            amount: range.isRange ? rate : range.average * rate
          };
        });
        paymentDetails.numberOfPieces = pieceEntries.map(e => parseRange(e.quantity).average).reduce((a, b) => a + b, 0);
        paymentDetails.ratePerPiece = pieceEntries[0]?.rate || '0';
      } else if (hasWeight) {
        paymentDetails.weightEntries = weightEntries.map(entry => {
          const range = parseRange(entry.quantity);
          const rate = parseFloat(entry.rate) || 0;
          return {
            quantity: entry.quantity,
            quantityRange: range.isRange ? { min: range.min, max: range.max } : null,
            averageQuantity: range.average,
            rate: rate,
            amount: range.isRange ? rate : range.average * rate
          };
        });
        paymentDetails.weightKg = weightEntries.map(e => parseRange(e.quantity).average).reduce((a, b) => a + b, 0);
        paymentDetails.ratePerKg = weightEntries[0]?.rate || '0';
      } else if (hasDistance) {
        paymentDetails.distanceEntries = distanceEntries.map(entry => {
          const range = parseRange(entry.quantity);
          const rate = parseFloat(entry.rate) || 0;
          return {
            quantity: entry.quantity,
            quantityRange: range.isRange ? { min: range.min, max: range.max } : null,
            averageQuantity: range.average,
            rate: rate,
            amount: range.isRange ? rate : range.average * rate
          };
        });
        paymentDetails.distanceKm = distanceEntries.map(e => parseRange(e.quantity).average).reduce((a, b) => a + b, 0);
        paymentDetails.ratePerKm = distanceEntries[0]?.rate || '0';
      }

      // Calculate total for the selected basis
      const entries = hasPieces ? paymentDetails.pieceEntries : hasWeight ? paymentDetails.weightEntries : paymentDetails.distanceEntries;
      const baseAmount = entries.reduce((sum: number, entry: any) => sum + entry.amount, 0);
      const totalAmount = baseAmount + (paymentDetails.extraFees || 0);

      paymentDetails.calculatedTotal = totalAmount;
      paymentDetails.baseAmount = baseAmount;

      // Create or update transaction
      if (isEditMode && existingTransactionId) {
        await api.transactions.update(existingTransactionId, {
          amount: totalAmount,
          fees: { extraFees: paymentDetails.extraFees || 0 },
          paymentDetails: paymentDetails
        });
        setMessage({ type: 'success', text: 'Payment record updated successfully!' });
      } else {
        await api.transactions.create({
          buyerId: partnerId,
          orderId: orderId || null,
          amount: totalAmount,
          currency: 'ETB',
          transactionType: 'partner_earning_record',
          paymentMethod: 'manual_partner_entry',
          status: 'completed',
          fees: { extraFees: paymentDetails.extraFees || 0 },
          paymentDetails: paymentDetails
        } as any);
        setMessage({ type: 'success', text: 'Payment record saved successfully!' });
      }
      
      // Call callback if provided
      if (onPaymentRecorded) {
        onPaymentRecorded();
      }
      
      // Only reset form if not in edit mode
      if (!isEditMode) {
        setPieceEntries([{ quantity: '', rate: '' }]);
        setWeightEntries([{ quantity: '', rate: '' }]);
        setDistanceEntries([{ quantity: '', rate: '' }]);
        setExtraFees('');
        setNotes('');
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to save payment record. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEntryRow = (
    entry: PaymentEntry,
    index: number,
    type: 'piece' | 'weight' | 'distance',
    onUpdate: (index: number, field: 'quantity' | 'rate', value: string) => void,
    onRemove: (index: number) => void,
    canRemove: boolean
  ) => {
    const range = parseRange(entry.quantity);
    const rate = parseFloat(entry.rate) || 0;
    const amount = range.average > 0 && rate > 0 ? (range.isRange ? rate : range.average * rate) : 0;
    
    const quantityLabel = type === 'piece' ? 'Number of Pieces' : type === 'weight' ? 'Weight (kg)' : 'Distance (km)';
    const quantityPlaceholder = type === 'piece' ? 'e.g. 10 or 10-20' : type === 'weight' ? 'e.g. 25.5 or 20-30' : 'e.g. 12.5 or 10-15';
    const rateLabel = range.isRange 
      ? 'Rate for Range (ETB)' 
      : type === 'piece' ? 'Rate per Piece (ETB)' : type === 'weight' ? 'Rate per Kilogram (ETB)' : 'Rate per Kilometer (ETB)';
    const ratePlaceholder = 'e.g. 50';

    return (
      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 bg-white rounded border border-gray-200">
        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {quantityLabel}
          </label>
          <input
            type="text"
            value={entry.quantity}
            onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={quantityPlaceholder}
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {rateLabel}
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={entry.rate}
            onChange={(e) => onUpdate(index, 'rate', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={ratePlaceholder}
          />
        </div>
        <div className="md:col-span-3 flex items-end">
          {amount > 0 && (
            <p className="text-xs text-green-600 font-medium">
              Amount: ETB {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="md:col-span-1 flex items-end justify-end">
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="px-2 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {isEditMode ? 'Edit Delivery Payment Record' : 'Record Delivery Payment'} 
          <span className="text-red-500">*Required</span>
        </h4>
        <p className="text-sm text-gray-600">
          {isEditMode 
            ? 'Update the payment details below. Fill only ONE payment basis (Piece, Weight, or Distance). Extra fees and notes are optional.'
            : orderId 
              ? 'Fill in payment details for ONE payment basis (Piece, Weight, or Distance). Payment will be calculated later based on order. Extra fees and notes are optional.'
              : 'Fill in payment details for a general delivery payment. Fill only ONE payment basis (Piece, Weight, or Distance). This will be calculated later based on order. Extra fees and notes are optional.'
          }
          {order && !isEditMode && (
            <span className="block mt-1 text-green-700 font-medium">
              💡 Order selected: Payment will be calculated based on this order's details.
            </span>
          )}
          {!orderId && !isEditMode && (
            <span className="block mt-1 text-blue-700 font-medium">
              💡 General Payment: This payment is not linked to a specific order and will be calculated later.
            </span>
          )}
        </p>
        <p className="text-sm text-orange-600 font-medium mt-2">
          ⚠️ Important: Fill only ONE payment basis (Piece, Weight, OR Distance), not all three.
        </p>
      </div>

      {loadingExisting && (
        <div className="mb-4 text-sm text-gray-600">Loading existing payment record...</div>
      )}

      {message && (
        <div
          className={`mb-4 text-sm px-4 py-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Piece-based Payment */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-gray-900 flex items-center">
              <span className="text-lg mr-2">📦</span>
              Payment by Piece
            </h5>
            <button
              type="button"
              onClick={addPieceEntry}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Entry
            </button>
          </div>
          <div className="space-y-2">
            {pieceEntries.map((entry, index) => 
              renderEntryRow(
                entry,
                index,
                'piece',
                updatePieceEntry,
                removePieceEntry,
                pieceEntries.length > 1
              )
            )}
          </div>
        </div>

        {/* Weight-based Payment */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-gray-900 flex items-center">
              <span className="text-lg mr-2">⚖️</span>
              Payment by Weight (kg)
            </h5>
            <button
              type="button"
              onClick={addWeightEntry}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Entry
            </button>
          </div>
          <div className="space-y-2">
            {weightEntries.map((entry, index) => 
              renderEntryRow(
                entry,
                index,
                'weight',
                updateWeightEntry,
                removeWeightEntry,
                weightEntries.length > 1
              )
            )}
          </div>
        </div>

        {/* Distance-based Payment */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-gray-900 flex items-center">
              <span className="text-lg mr-2">📏</span>
              Payment by Distance (km)
            </h5>
            <button
              type="button"
              onClick={addDistanceEntry}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Entry
            </button>
          </div>
          <div className="space-y-2">
            {distanceEntries.map((entry, index) => 
              renderEntryRow(
                entry,
                index,
                'distance',
                updateDistanceEntry,
                removeDistanceEntry,
                distanceEntries.length > 1
              )
            )}
          </div>
        </div>

        {/* Common Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extra Fees / Allowance (ETB) <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={extraFees}
              onChange={(e) => setExtraFees(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter amount or leave empty"
            />
            <p className="text-xs text-gray-500 mt-1">Additional charges (parking, tolls, etc.) - Optional</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe the delivery, route, or any important details (optional)..."
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Add any additional details about the delivery</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              isEditMode ? 'Update Payment Record' : 'Save Payment Record'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PartnerPaymentRecordForm;
