import { useState } from 'react';
import FileUpload from './FileUpload';

interface PaymentFormProps {
  orderId: string;
  buyerId: string;
  amount: number;
  fees: {
    deliveryFee: number;
    serviceFee: number;
    platformFee: number;
    total: number;
  };
  onSuccess: (transaction: any) => void;
  onCancel: () => void;
}

type PaymentMethod = 
  | 'transfer' 
  | 'm_pesa' 
  | 'm_birr' 
  | 'cbe_birr' 
  | 'telebirr' 
  | 'mpesa_ethiopia' 
  | 'paypal' 
  | 'stripe' 
  | 'wise' 
  | 'skrill' 
  | 'payoneer' 
  | 'remitly' 
  | 'western_union' 
  | 'moneygram' 
  | 'cash' 
  | 'acha_pay';

function PaymentForm({ orderId, buyerId, amount, fees, onSuccess, onCancel }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [paymentDetails, setPaymentDetails] = useState({
    transactionReference: '',
    bankAccount: '',
    mobileMoneyNumber: '',
    paymentProof: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { api } = await import('../services/api');
      
      // Map transfer to bank_transfer for backend compatibility
      const backendPaymentMethod = paymentMethod === 'transfer' ? 'bank_transfer' : paymentMethod;
      
      const transactionData = {
        orderId,
        buyerId,
        transactionType: 'order_payment',
        paymentMethod: backendPaymentMethod,
        amount: amount + fees.total,
        currency: 'ETB',
        fees,
        paymentDetails: {
          transactionReference: paymentDetails.transactionReference || undefined,
          bankAccount: paymentDetails.bankAccount || undefined,
          mobileMoneyNumber: paymentDetails.mobileMoneyNumber || undefined,
          paymentProof: paymentDetails.paymentProof || undefined,
          notes: paymentDetails.notes || undefined
        }
      };

      const response = await api.transactions.create(transactionData) as { status?: string; data?: any; message?: string };
      
      if (response.status === 'success') {
        onSuccess(response.data);
      } else {
        setError(response.message || 'Failed to process payment');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Information</h2>
      
      {/* Amount Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Item Value:</span>
            <span className="font-semibold">{amount.toFixed(2)} ETB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-semibold">{fees.deliveryFee.toFixed(2)} ETB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service Fee:</span>
            <span className="font-semibold">{fees.serviceFee.toFixed(2)} ETB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Fee:</span>
            <span className="font-semibold">{fees.platformFee.toFixed(2)} ETB</span>
          </div>
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-lg font-bold text-blue-600">{(amount + fees.total).toFixed(2)} ETB</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-300 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method <span className="text-red-500">*</span>
          </label>
          
          {/* Transfer - Active */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Now:</label>
            <select
              value={paymentMethod === 'transfer' ? 'transfer' : ''}
              onChange={() => setPaymentMethod('transfer')}
              className="w-full px-4 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
            >
              <option value="transfer">Bank Transfer / Manual Transfer</option>
            </select>
          </div>

          {/* Ethiopia Payment Gateways - Coming Soon */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ethiopia Payment Gateways (Coming Soon):</label>
            <select
              value={paymentMethod.startsWith('m_') || paymentMethod === 'cbe_birr' || paymentMethod === 'telebirr' || paymentMethod === 'mpesa_ethiopia' ? paymentMethod : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setPaymentMethod(e.target.value as PaymentMethod);
                } else {
                  setPaymentMethod('transfer');
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              <option value="">Select Ethiopia Gateway...</option>
              <option value="m_pesa">M-Pesa (Coming Soon)</option>
              <option value="m_birr">M-Birr (Coming Soon)</option>
              <option value="cbe_birr">CBE Birr (Coming Soon)</option>
              <option value="telebirr">Telebirr (Coming Soon)</option>
              <option value="mpesa_ethiopia">M-Pesa Ethiopia (Coming Soon)</option>
            </select>
          </div>

          {/* Worldwide Payment Gateways - Coming Soon */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Worldwide Payment Gateways (Coming Soon):</label>
            <select
              value={paymentMethod === 'paypal' || paymentMethod === 'stripe' || paymentMethod === 'wise' || paymentMethod === 'skrill' || paymentMethod === 'payoneer' || paymentMethod === 'remitly' || paymentMethod === 'western_union' || paymentMethod === 'moneygram' ? paymentMethod : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setPaymentMethod(e.target.value as PaymentMethod);
                } else {
                  setPaymentMethod('transfer');
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              <option value="">Select Worldwide Gateway...</option>
              <option value="paypal">PayPal (Coming Soon)</option>
              <option value="stripe">Stripe (Coming Soon)</option>
              <option value="wise">Wise (Coming Soon)</option>
              <option value="skrill">Skrill (Coming Soon)</option>
              <option value="payoneer">Payoneer (Coming Soon)</option>
              <option value="remitly">Remitly (Coming Soon)</option>
              <option value="western_union">Western Union (Coming Soon)</option>
              <option value="moneygram">MoneyGram (Coming Soon)</option>
            </select>
          </div>

          {/* Other Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Options:</label>
            <select
              value={paymentMethod === 'cash' || paymentMethod === 'acha_pay' ? paymentMethod : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setPaymentMethod(e.target.value as PaymentMethod);
                } else {
                  setPaymentMethod('transfer');
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Other Option...</option>
              <option value="cash">Cash</option>
              <option value="acha_pay">Acha Pay (Coming Soon)</option>
            </select>
          </div>

          {/* Warning for Coming Soon methods */}
          {paymentMethod !== 'transfer' && paymentMethod !== 'cash' && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Coming Soon:</strong> This payment method is currently under development. Please use manual transfer and upload proof of payment.
              </p>
            </div>
          )}
        </div>

        {/* Payment Details based on method */}
        {paymentMethod === 'transfer' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Manual Transfer Instructions:</strong>
              </p>
              <p className="text-sm text-blue-700">
                Please transfer the amount manually and upload proof of payment below. Automated payment processing is coming soon.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number (if applicable)
              </label>
              <input
                type="text"
                value={paymentDetails.bankAccount}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, bankAccount: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                placeholder="Enter bank account number (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Reference
              </label>
              <input
                type="text"
                value={paymentDetails.transactionReference}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, transactionReference: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                placeholder="Enter transaction reference number"
              />
            </div>
            <div>
              <FileUpload
                label="Payment Proof (Receipt/Screenshot)"
                value={paymentDetails.paymentProof}
                onChange={(path) => setPaymentDetails(prev => ({ ...prev, paymentProof: path }))}
                accept="image/*,.pdf"
              />
            </div>
          </>
        )}

        {(paymentMethod === 'm_pesa' || paymentMethod === 'm_birr' || paymentMethod === 'cbe_birr' || paymentMethod === 'telebirr' || paymentMethod === 'mpesa_ethiopia') && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Manual Transfer Instructions:</strong>
              </p>
              <p className="text-sm text-blue-700">
                Please transfer the amount manually via mobile money and upload proof of payment below. Automated payment processing is coming soon.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Money Number (if applicable)
              </label>
              <input
                type="text"
                value={paymentDetails.mobileMoneyNumber}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, mobileMoneyNumber: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                placeholder="Enter mobile money number (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Reference
              </label>
              <input
                type="text"
                value={paymentDetails.transactionReference}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, transactionReference: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                placeholder="Enter transaction reference number"
              />
            </div>
            <div>
              <FileUpload
                label="Payment Proof (Screenshot)"
                value={paymentDetails.paymentProof}
                onChange={(path) => setPaymentDetails(prev => ({ ...prev, paymentProof: path }))}
                accept="image/*"
              />
            </div>
          </>
        )}

        {paymentMethod === 'cash' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={paymentDetails.notes}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
              rows={3}
              placeholder="Any additional notes about cash payment..."
            />
          </div>
        )}

        {(paymentMethod === 'paypal' || paymentMethod === 'stripe' || paymentMethod === 'wise' || paymentMethod === 'skrill' || paymentMethod === 'payoneer' || paymentMethod === 'remitly' || paymentMethod === 'western_union' || paymentMethod === 'moneygram') && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Manual Transfer Instructions:</strong>
              </p>
              <p className="text-sm text-blue-700">
                Please complete the payment manually via {paymentMethod.replace('_', ' ').toUpperCase()} and upload proof of payment below. Automated payment processing is coming soon.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Reference (if applicable)
              </label>
              <input
                type="text"
                value={paymentDetails.transactionReference}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, transactionReference: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                placeholder={`Enter ${paymentMethod.replace('_', ' ')} transaction reference (optional)`}
              />
            </div>
            <div>
              <FileUpload
                label="Payment Proof (Receipt)"
                value={paymentDetails.paymentProof}
                onChange={(path) => setPaymentDetails(prev => ({ ...prev, paymentProof: path }))}
                accept="image/*,.pdf"
              />
            </div>
          </>
        )}

        {paymentMethod === 'acha_pay' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Coming Soon:</strong> Acha Pay integration is under development.
            </p>
            <p className="text-sm text-blue-700">
              Please use manual transfer for now and upload proof of payment below.
            </p>
          </div>
        )}

        {/* Notes */}
        {paymentMethod !== 'cash' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={paymentDetails.notes}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
              rows={3}
              placeholder="Any additional information..."
            />
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              'Submit Payment'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaymentForm;


