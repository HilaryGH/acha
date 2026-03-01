/**
 * Partner Pricing Calculation Utility
 * Calculates delivery fees based on partner's listed pricing rates
 */

export type PartnerPricingRates = {
  pieceRates?: Array<{
    quantity: string;
    quantityRange?: { min: number; max: number } | null;
    averageQuantity: number;
    rate: number;
  }>;
  weightRates?: Array<{
    quantity: string;
    quantityRange?: { min: number; max: number } | null;
    averageQuantity: number;
    rate: number;
  }>;
  distanceRates?: Array<{
    quantity: string;
    quantityRange?: { min: number; max: number } | null;
    averageQuantity: number;
    rate: number;
  }>;
  extraFees?: number;
};

/**
 * Parse range input (e.g., "10-20", "10 to 20", "10 - 20", or single number)
 */
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

/**
 * Find matching rate from entries based on value
 */
const findMatchingRate = (entries: PartnerPricingRates['pieceRates'] | PartnerPricingRates['weightRates'] | PartnerPricingRates['distanceRates'], value: number): number | null => {
  if (!entries || entries.length === 0 || value <= 0) return null;
  
  let bestMatch: { rate: number; priority: number } | null = null;
  
  for (const entry of entries) {
    const range = parseRange(entry.quantity);
    const rate = entry.rate || 0;
    
    if (rate > 0) {
      if (range.isRange && entry.quantityRange) {
        // Check if value falls within the range
        if (value >= entry.quantityRange.min && value <= entry.quantityRange.max) {
          // Prefer exact matches or smaller ranges (more specific)
          const rangeSize = entry.quantityRange.max - entry.quantityRange.min;
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
      const rate = entry.rate || 0;
      
      if (rate > 0 && range.isRange && entry.quantityRange) {
        // Calculate distance to range
        let distance = 0;
        if (value < entry.quantityRange.min) {
          distance = entry.quantityRange.min - value;
        } else if (value > entry.quantityRange.max) {
          distance = value - entry.quantityRange.max;
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

/**
 * Calculate delivery fee based on partner pricing rates and order details
 * @param pricingRates - Partner's pricing rates
 * @param orderInfo - Order information with quantity description
 * @param quantityType - Type of quantity (pieces, weight, or distance)
 * @returns Calculated delivery fee, or null if no matching rate found
 */
export const calculateDeliveryFeeFromPartnerRates = (
  pricingRates: PartnerPricingRates | null | undefined,
  orderInfo: { quantityDescription?: string; quantityType?: 'pieces' | 'weight' },
  distanceKm?: number
): number | null => {
  if (!pricingRates) return null;

  let calculatedFee = 0;
  let foundMatch = false;

  // Calculate based on weight
  if (pricingRates.weightRates && pricingRates.weightRates.length > 0) {
    const quantityStr = orderInfo.quantityDescription || '';
    const weightMatch = quantityStr.match(/[\d.]+/);
    const weight = weightMatch ? parseFloat(weightMatch[0]) : 0;
    
    if (weight > 0) {
      const rate = findMatchingRate(pricingRates.weightRates, weight);
      if (rate !== null) {
        calculatedFee += weight * rate;
        foundMatch = true;
      }
    }
  }

  // Calculate based on pieces
  if (!foundMatch && pricingRates.pieceRates && pricingRates.pieceRates.length > 0) {
    const quantityStr = orderInfo.quantityDescription || '';
    const pieceMatch = quantityStr.match(/\d+/);
    const pieces = pieceMatch ? parseFloat(pieceMatch[0]) : 0;
    
    if (pieces > 0) {
      const rate = findMatchingRate(pricingRates.pieceRates, pieces);
      if (rate !== null) {
        calculatedFee += pieces * rate;
        foundMatch = true;
      }
    }
  }

  // Calculate based on distance
  if (!foundMatch && pricingRates.distanceRates && pricingRates.distanceRates.length > 0 && distanceKm !== undefined && distanceKm > 0) {
    const rate = findMatchingRate(pricingRates.distanceRates, distanceKm);
    if (rate !== null) {
      calculatedFee += distanceKm * rate;
      foundMatch = true;
    }
  }

  // Add extra fees if any
  if (foundMatch && pricingRates.extraFees) {
    calculatedFee += pricingRates.extraFees;
  }

  return foundMatch ? calculatedFee : null;
};

/**
 * Extract pricing rates from transaction paymentDetails
 */
export const extractPricingRatesFromTransaction = (transaction: any): PartnerPricingRates | null => {
  if (!transaction || !transaction.paymentDetails) return null;
  
  const details = transaction.paymentDetails;
  
  // Check if this is a pricing rate record (has rates but no actual payment calculation)
  if (details.pieceRates || details.weightRates || details.distanceRates) {
    return {
      pieceRates: details.pieceRates,
      weightRates: details.weightRates,
      distanceRates: details.distanceRates,
      extraFees: details.extraFees || 0
    };
  }
  
  return null;
};
