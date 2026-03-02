import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface PartnerPaymentRecordFormProps {
  partnerId: string;
  role: string;
  orderId?: string; // Optional: link payment to specific order
  order?: any; // Optional: order details for auto-calculation
  existingTransactionId?: string; // Optional: ID of existing transaction to edit
  onPaymentRecorded?: () => void; // Callback after successful submission
  ordersNeedingPayment?: any[]; // Optional: list of orders that need payment for bulk calculation
}

interface PaymentEntry {
  quantity: string; // Can be number or range
  rate: string;
}

function PartnerPaymentRecordForm({ partnerId, role, orderId, order, existingTransactionId, onPaymentRecorded, ordersNeedingPayment = [] }: PartnerPaymentRecordFormProps) {
  // Mode: 'priceList' for setting price list, 'bulkCalculate' for calculating payments for all orders
  const [mode, setMode] = useState<'priceList' | 'bulkCalculate'>('bulkCalculate');
  
  // For bulk calculation mode - use same entry arrays as price list
  const [bulkExtraFees, setBulkExtraFees] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  
  // Shared entries for both modes
  const [pieceEntries, setPieceEntries] = useState<PaymentEntry[]>([{ quantity: '', rate: '' }]);
  const [weightEntries, setWeightEntries] = useState<PaymentEntry[]>([{ quantity: '', rate: '' }]);
  const [distanceEntries, setDistanceEntries] = useState<PaymentEntry[]>([{ quantity: '', rate: '' }]);
  
  // Common fields
  const [extraFees, setExtraFees] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
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

  // Helper function to find matching rate from entries
  const findMatchingRate = (entries: PaymentEntry[], value: number): number | null => {
    if (value <= 0) return null;
    
    let bestMatch: { rate: number; priority: number } | null = null;
    
    for (const entry of entries) {
      const range = parseRange(entry.quantity);
      const rate = parseFloat(entry.rate) || 0;
      
      if (rate > 0) {
        if (range.isRange) {
          // Check if value falls within the range
          if (value >= range.min && value <= range.max) {
            // Prefer exact matches or smaller ranges (more specific)
            const rangeSize = range.max - range.min;
            const priority = rangeSize === 0 ? 1 : 1 / rangeSize; // Smaller range = higher priority
            
            if (!bestMatch || priority > bestMatch.priority) {
              bestMatch = { rate, priority };
            }
          }
        } else {
          // Single value - use if it matches exactly
          if (value === range.average) {
            // Exact match has highest priority
            return rate;
          }
        }
      }
    }
    
    // If no exact match found, try to find closest range
    if (!bestMatch) {
      let closestMatch: { rate: number; distance: number } | null = null;
      
      for (const entry of entries) {
        const range = parseRange(entry.quantity);
        const rate = parseFloat(entry.rate) || 0;
        
        if (rate > 0 && range.isRange) {
          // Calculate distance to range
          let distance = 0;
          if (value < range.min) {
            distance = range.min - value;
          } else if (value > range.max) {
            distance = value - range.max;
          } else {
            distance = 0; // Already handled above
          }
          
          // Use closest range if within reasonable distance (20% of value)
          if (distance <= value * 0.2 && (!closestMatch || distance < closestMatch.distance)) {
            closestMatch = { rate, distance };
          }
        }
      }
      
      if (closestMatch) {
        return closestMatch.rate;
      }
    }
    
    return bestMatch ? bestMatch.rate : null;
  };

  // Bulk calculation handler
  const handleBulkCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate that at least one payment basis has entries
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

    if (!hasPieces && !hasWeight && !hasDistance) {
      setMessage({ type: 'error', text: 'Please add at least one payment basis (Piece, Weight, or Distance) with valid rates.' });
      return;
    }

    if (ordersNeedingPayment.length === 0) {
      setMessage({ type: 'error', text: 'No orders found that need payment calculation.' });
      return;
    }

    try {
      setLoading(true);
      const extraFeesAmount = bulkExtraFees ? parseFloat(bulkExtraFees) : 0;

      // Calculate and create payment records for all orders
      const results = [];
      const errors = [];

      for (const order of ordersNeedingPayment) {
        try {
          let calculatedAmount = 0;
          const orderInfo = order.orderInfo || {};
          const paymentBases: string[] = [];

          // Calculate based on piece entries if available
          if (hasPieces) {
            const quantityStr = orderInfo.quantityDescription || '';
            const pieceMatch = quantityStr.match(/\d+/);
            const pieces = pieceMatch ? parseFloat(pieceMatch[0]) : 0;
            
            if (pieces > 0) {
              const rate = findMatchingRate(pieceEntries, pieces);
              if (rate !== null) {
                calculatedAmount += pieces * rate;
                paymentBases.push(`pieces: ${pieces} × ${rate}`);
              }
            }
          }

          // Calculate based on weight entries if available
          if (hasWeight) {
            const quantityStr = orderInfo.quantityDescription || '';
            const weightMatch = quantityStr.match(/[\d.]+/);
            const weight = weightMatch ? parseFloat(weightMatch[0]) : 0;
            
            if (weight > 0) {
              const rate = findMatchingRate(weightEntries, weight);
              if (rate !== null) {
                calculatedAmount += weight * rate;
                paymentBases.push(`weight: ${weight}kg × ${rate}`);
              }
            }
          }

          // Calculate based on distance entries if available
          if (hasDistance) {
            // Try to get distance from order pricing or estimate
            let distance = 0;
            if (order.pricing?.deliveryFee) {
              // Estimate distance from delivery fee (rough calculation)
              distance = order.pricing.deliveryFee / 10;
            } else if (order.deliveryLocation && order.pickupLocation) {
              // Could use actual distance calculation here if available
              distance = 5; // Default estimate
            } else {
              distance = 5; // Default estimate
            }
            
            if (distance > 0) {
              const rate = findMatchingRate(distanceEntries, distance);
              if (rate !== null) {
                calculatedAmount += distance * rate;
                paymentBases.push(`distance: ${distance.toFixed(1)}km × ${rate}`);
              }
            }
          }

          if (calculatedAmount === 0) {
            // No matching rates found, skip this order
            errors.push({ orderId: order._id, error: 'No matching rate found for order values' });
            continue;
          }

          const totalAmount = calculatedAmount + extraFeesAmount;

          // Create payment record for this order
          await api.transactions.create({
            buyerId: partnerId,
            orderId: order._id,
            amount: totalAmount,
            currency: 'ETB',
            transactionType: 'partner_earning_record',
            paymentMethod: 'manual_partner_entry',
            status: 'completed',
            fees: { extraFees: extraFeesAmount },
            paymentDetails: {
              role,
              paymentBases: paymentBases.join(', '),
              calculatedAmount: calculatedAmount,
              extraFees: extraFeesAmount,
              notes: bulkNotes ? bulkNotes.trim() : ''
            }
          } as any);

          results.push({ orderId: order._id, amount: totalAmount });
        } catch (error: any) {
          errors.push({ orderId: order._id, error: error.message || 'Failed to create payment record' });
        }
      }

      if (results.length > 0) {
        setMessage({ 
          type: 'success', 
          text: `Successfully calculated and recorded payments for ${results.length} order${results.length !== 1 ? 's' : ''}!${errors.length > 0 ? ` (${errors.length} failed)` : ''}` 
        });
        
        // Reset form
        setPieceEntries([{ quantity: '', rate: '' }]);
        setWeightEntries([{ quantity: '', rate: '' }]);
        setDistanceEntries([{ quantity: '', rate: '' }]);
        setBulkExtraFees('');
        setBulkNotes('');
        
        // Call callback to reload orders
        if (onPaymentRecorded) {
          onPaymentRecorded();
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: `Failed to create payment records. ${errors.length > 0 ? errors.map(e => e.error).join(', ') : ''}` 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to calculate payments. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
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

    // If order has confirmed pricing, payment basis is optional
    const hasConfirmedPricing = order && order.pricing && order.pricing.deliveryFee && order.pricing.deliveryFee > 0;
    
    // If no payment basis filled and order has confirmed pricing, that's okay - it's optional
    // But if they're trying to submit, they need to fill at least one basis to save something
    if (filledBases === 0 && hasConfirmedPricing) {
      setMessage({ 
        type: 'info', 
        text: 'Payment basis is optional for orders with confirmed pricing. If you want to save or update your general price list for future estimations, please fill at least one payment basis. Otherwise, use the "Skip" button.' 
      });
      return;
    }
    
    // If no payment basis filled and order doesn't have confirmed pricing, it's required
    if (filledBases === 0 && !hasConfirmedPricing) {
      setMessage({ type: 'error', text: 'Please fill at least one payment basis (Piece, Weight, or Distance) with valid values.' });
      return;
    }

    // Validate entries for all filled payment bases
    let isValid = true;
    let errorMessage = '';

    // Validate piece entries if filled
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
    }

    // Validate weight entries if filled
    if (hasWeight && isValid) {
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
    }

    // Validate distance entries if filled
    if (hasDistance && isValid) {
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

      // Prepare pricing rates - this is a price list, not a payment calculation
      let pricingRates: any = {
        role,
        extraFees: extraFees ? parseFloat(extraFees) : 0,
        notes: notes ? notes.trim() : '',
      };

      // Add piece rate entries if filled
      if (hasPieces) {
        pricingRates.pieceRates = pieceEntries.map(entry => {
          const range = parseRange(entry.quantity);
          const rate = parseFloat(entry.rate) || 0;
          return {
            quantity: entry.quantity,
            quantityRange: range.isRange ? { min: range.min, max: range.max } : null,
            averageQuantity: range.average,
            rate: rate
          };
        });
      }

      // Add weight rate entries if filled
      if (hasWeight) {
        pricingRates.weightRates = weightEntries.map(entry => {
          const range = parseRange(entry.quantity);
          const rate = parseFloat(entry.rate) || 0;
          return {
            quantity: entry.quantity,
            quantityRange: range.isRange ? { min: range.min, max: range.max } : null,
            averageQuantity: range.average,
            rate: rate
          };
        });
      }

      // Add distance rate entries if filled
      if (hasDistance) {
        pricingRates.distanceRates = distanceEntries.map(entry => {
          const range = parseRange(entry.quantity);
          const rate = parseFloat(entry.rate) || 0;
          return {
            quantity: entry.quantity,
            quantityRange: range.isRange ? { min: range.min, max: range.max } : null,
            averageQuantity: range.average,
            rate: rate
          };
        });
      }

      // Save pricing rates to user profile (not as a transaction)
      // This will be used to calculate payment when orders come in
      if (isEditMode && existingTransactionId) {
        // Update existing pricing rates - preserve existing transaction data
        await api.transactions.update(existingTransactionId, {
          paymentDetails: pricingRates,
          fees: { extraFees: pricingRates.extraFees || 0 }
        });
        setMessage({ type: 'success', text: 'Pricing rates updated successfully!' });
      } else {
        // Create a pricing record (stored as transaction for now, but represents pricing rates)
        // Use minimal amount since this is just a price list, not an actual payment
        await api.transactions.create({
          buyerId: partnerId,
          orderId: orderId || null,
          amount: 0.01, // Minimal amount - this is just a price list, not an actual payment
          currency: 'ETB',
          transactionType: 'partner_earning_record',
          paymentMethod: 'manual_partner_entry',
          status: 'completed',
          fees: { extraFees: pricingRates.extraFees || 0 },
          paymentDetails: pricingRates
        } as any);
        setMessage({ type: 'success', text: 'Pricing rates saved successfully! These rates will be used to calculate payment when orders are assigned to you.' });
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
    
    const quantityLabel = type === 'piece' ? 'Number of Pieces' : type === 'weight' ? 'Weight (kg)' : 'Distance (km)';
    const quantityPlaceholder = type === 'piece' ? 'e.g. 10 or 10-20' : type === 'weight' ? 'e.g. 25.5 or 20-30' : 'e.g. 12.5 or 10-15';
    const rateLabel = range.isRange 
      ? 'Rate for Range (ETB)' 
      : type === 'piece' ? 'Rate per Piece (ETB)' : type === 'weight' ? 'Rate per Kilogram (ETB)' : 'Rate per Kilometer (ETB)';
    const ratePlaceholder = 'e.g. 50';
    const rangeDescription = range.isRange 
      ? `Range: ${range.min}-${range.max}` 
      : range.average > 0 
        ? `Single: ${range.average}` 
        : '';

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
          {rangeDescription && (
            <p className="text-xs text-gray-500 mt-1">{rangeDescription}</p>
          )}
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
          {rate > 0 && (
            <p className="text-xs text-gray-500 mt-1">Rate: {rate} ETB</p>
          )}
        </div>
        <div className="md:col-span-3 flex items-end">
          {rate > 0 && (
            <p className="text-xs text-blue-600 font-medium">
              {range.isRange 
                ? `Flat rate: ${rate} ETB for this range`
                : `Rate: ${rate} ETB per unit`}
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
          {mode === 'bulkCalculate' ? 'Calculate Payments for All Orders' : (isEditMode ? 'Edit Pricing Rates' : 'Set Pricing Rates')}
          {order && order.pricing && order.pricing.deliveryFee && order.pricing.deliveryFee > 0 ? (
            <span className="text-blue-600 text-sm font-normal ml-2">(Optional - Order already has confirmed price)</span>
          ) : (
            <span className="text-red-500">*Required</span>
          )}
        </h4>
        
        {/* Mode Selector */}
        {!existingTransactionId && (
          <div className="mb-4 flex gap-2 border-b border-gray-200 pb-4">
            <button
              type="button"
              onClick={() => setMode('bulkCalculate')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'bulkCalculate'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Calculate Payments for All Orders
            </button>
            <button
              type="button"
              onClick={() => setMode('priceList')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'priceList'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Set Price List
            </button>
          </div>
        )}

        {mode === 'bulkCalculate' ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Add payment rates for one or more payment bases below. You can add multiple entries for each basis (e.g., different rates for different distance ranges like 0-5km = 80 ETB, 5-10km = 100 ETB). The system will automatically match each order's values to the appropriate rate and calculate payments for all orders.
            </p>
            {ordersNeedingPayment.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-900">
                  📦 {ordersNeedingPayment.length} order{ordersNeedingPayment.length !== 1 ? 's' : ''} will be calculated:
                </p>
                <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
                  {ordersNeedingPayment.slice(0, 5).map((order) => (
                    <li key={order._id}>
                      Order #{order.uniqueId || order._id.slice(-8)} - {order.orderInfo?.productName || 'N/A'}
                    </li>
                  ))}
                  {ordersNeedingPayment.length > 5 && (
                    <li className="text-gray-600">...and {ordersNeedingPayment.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div>
            {order && order.pricing && order.pricing.deliveryFee && order.pricing.deliveryFee > 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  ℹ️ This order already has a confirmed delivery fee: <strong>ETB {order.pricing.deliveryFee.toFixed(2)}</strong>
                </p>
                <p className="text-sm text-blue-700">
                  Payment basis form is <strong>optional</strong> for this order. You can fill it out to update your general price list for future order estimations, but it's not required since the price is already confirmed.
                </p>
              </div>
            ) : null}
            <p className="text-sm text-gray-600">
              {isEditMode 
                ? 'Update your pricing rates below. Set rates for Piece, Weight, and/or Distance. When orders are assigned to you, payment will be calculated based on the order\'s actual values using these rates.'
                : orderId 
                  ? order && order.pricing && order.pricing.deliveryFee && order.pricing.deliveryFee > 0
                    ? 'Payment basis is optional for this order since it already has a confirmed price. Fill this out only if you want to update your general price list.'
                    : 'Set your pricing rates for this order. Payment will be calculated based on the order\'s actual pieces, weight, or distance using these rates.'
                  : 'Set your pricing rates (price list). You can configure rates for Piece, Weight, and/or Distance. When orders are assigned to you, payment will be calculated automatically based on the order\'s actual values using these rates.'
              }
            </p>
            {order && !isEditMode && !(order.pricing && order.pricing.deliveryFee && order.pricing.deliveryFee > 0) && (
              <span className="block mt-1 text-green-700 font-medium">
                💡 Order selected: Payment will be calculated based on this order's actual pieces/weight/distance using your rates.
              </span>
            )}
            {!orderId && !isEditMode && (
              <span className="block mt-1 text-blue-700 font-medium">
                💡 This is your price list. When orders are assigned to you, payment will be calculated automatically using these rates.
              </span>
            )}
          </div>
        )}
      </div>

      {loadingExisting && (
        <div className="mb-4 text-sm text-gray-600">Loading existing payment record...</div>
      )}

      {message && (
        <div
          className={`mb-4 text-sm px-4 py-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : message.type === 'info'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {mode === 'bulkCalculate' ? (
        <form onSubmit={handleBulkCalculate} className="space-y-6">
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
                value={bulkExtraFees}
                onChange={(e) => setBulkExtraFees(e.target.value)}
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
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Add notes that will apply to all payments (optional)..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || ordersNeedingPayment.length === 0}
              className="px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </span>
              ) : (
                `Calculate & Record Payments for ${ordersNeedingPayment.length} Order${ordersNeedingPayment.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </form>
      ) : (
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
          {order && order.pricing && order.pricing.deliveryFee && order.pricing.deliveryFee > 0 && (
            <button
              type="button"
              onClick={() => {
                if (onPaymentRecorded) {
                  onPaymentRecorded();
                }
                setMessage({ 
                  type: 'success', 
                  text: 'Payment basis form skipped. Order already has confirmed pricing, so payment basis is optional and only needed for updating your general price list.' 
                });
              }}
              className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Skip (Optional)
            </button>
          )}
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
              isEditMode ? 'Update Pricing Rates' : 'Save Pricing Rates'
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}

export default PartnerPaymentRecordForm;
