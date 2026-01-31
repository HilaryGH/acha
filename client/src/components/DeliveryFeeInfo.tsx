import { DELIVERY_FEE_STRUCTURE } from '../utils/deliveryFee';

/**
 * Component to display all delivery fee information
 * Can be used on info pages, pricing pages, etc.
 */
function DeliveryFeeInfo() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Delivery Fee Structure</h3>
      
      <div className="space-y-4">
        {/* Cycle Riders */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">🚴 Cycle Riders</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Flag down fee (Base fee):</span>
              <span className="font-semibold">{DELIVERY_FEE_STRUCTURE['cycle-rider'].baseFee} Birr</span>
            </div>
            <div className="flex justify-between">
              <span>Per Km:</span>
              <span className="font-semibold">{DELIVERY_FEE_STRUCTURE['cycle-rider'].perKmFee} Birr</span>
            </div>
          </div>
        </div>

        {/* E Bike Riders */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">🛵 E Bike Riders</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Flag down fee (Base fee):</span>
              <span className="font-semibold">{DELIVERY_FEE_STRUCTURE['e-bike-rider'].baseFee} Birr</span>
            </div>
            <div className="flex justify-between">
              <span>Per Km:</span>
              <span className="font-semibold">{DELIVERY_FEE_STRUCTURE['e-bike-rider'].perKmFee} Birr</span>
            </div>
          </div>
        </div>

        {/* Motorcycle Riders */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">🏍️ Motorcycle Riders</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Flag down fee (Base fee):</span>
              <span className="font-semibold">{DELIVERY_FEE_STRUCTURE['motorcycle-rider'].baseFee} Birr</span>
            </div>
            <div className="flex justify-between">
              <span>Per Km:</span>
              <span className="font-semibold">{DELIVERY_FEE_STRUCTURE['motorcycle-rider'].perKmFee} Birr</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Delivery fees are automatically calculated based on the selected delivery mechanism and distance (in kilometers).
        </p>
      </div>
    </div>
  );
}

export default DeliveryFeeInfo;



























