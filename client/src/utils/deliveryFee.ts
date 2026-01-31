/**
 * Delivery Fee Calculation Utility
 * Calculates delivery fees based on delivery mechanism and distance
 */

export type DeliveryMechanism = 'cycle-rider' | 'e-bike-rider' | 'motorcycle-rider';

export interface DeliveryFeeStructure {
  baseFee: number;
  perKmFee: number;
}

export const DELIVERY_FEE_STRUCTURE: Record<DeliveryMechanism, DeliveryFeeStructure> = {
  'cycle-rider': {
    baseFee: 35,
    perKmFee: 50
  },
  'e-bike-rider': {
    baseFee: 130,
    perKmFee: 18
  },
  'motorcycle-rider': {
    baseFee: 100,
    perKmFee: 80
  }
};

/**
 * Calculate delivery fee based on mechanism and distance
 * @param mechanism - Delivery mechanism type
 * @param distanceKm - Distance in kilometers (optional, defaults to 0 for base fee only)
 * @returns Total delivery fee in Birr
 */
export const calculateDeliveryFee = (mechanism: DeliveryMechanism, distanceKm: number = 0): number => {
  const structure = DELIVERY_FEE_STRUCTURE[mechanism];
  if (!structure) {
    return 0;
  }
  
  return structure.baseFee + (structure.perKmFee * distanceKm);
};

/**
 * Get delivery fee structure for a mechanism
 * @param mechanism - Delivery mechanism type
 * @returns Delivery fee structure with base fee and per km fee
 */
export const getDeliveryFeeStructure = (mechanism: DeliveryMechanism): DeliveryFeeStructure | null => {
  return DELIVERY_FEE_STRUCTURE[mechanism] || null;
};

/**
 * Format delivery fee information as a string
 * @param mechanism - Delivery mechanism type
 * @returns Formatted string with fee information
 */
export const formatDeliveryFeeInfo = (mechanism: DeliveryMechanism): string => {
  const structure = getDeliveryFeeStructure(mechanism);
  if (!structure) {
    return '';
  }
  
  const mechanismName = mechanism === 'cycle-rider' ? 'Cycle Riders' :
                       mechanism === 'e-bike-rider' ? 'E Bike Riders' :
                       'Motorcycle Riders';
  
  return `${mechanismName}: Base fee ${structure.baseFee} Birr + ${structure.perKmFee} Birr per Km`;
};



























