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
  // ETB/Birr methods
  | 'telebirr'
  | 'bank_transfer'
  | 'card'
  | 'bank_app'
  | 'wallet'
  | 'chapa'
  // USD methods
  | 'paypal'
  | 'stripe'
  | 'visa_mastercard'
  | 'international_bank_transfer';

type Currency = 'ETB' | 'USD';

function PaymentForm({ orderId, buyerId, amount, fees, onSuccess, onCancel }: PaymentFormProps) {
  const [currency, setCurrency] = useState<Currency>('ETB');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('telebirr');
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
      
      // Map payment methods for backend compatibility
      let backendPaymentMethod = paymentMethod;
      if (paymentMethod === 'bank_transfer') {
        backendPaymentMethod = 'bank_transfer';
      } else if (paymentMethod === 'visa_mastercard') {
        backendPaymentMethod = 'stripe'; // Use stripe for card payments
      } else if (paymentMethod === 'international_bank_transfer') {
        backendPaymentMethod = 'bank_transfer';
      }
      
      const transactionData = {
        orderId,
        buyerId,
        transactionType: 'order_payment',
        paymentMethod: backendPaymentMethod,
        amount: amount + fees.total,
        currency: currency,
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
            <span className="font-semibold">{amount.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-semibold">{fees.deliveryFee.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service Fee:</span>
            <span className="font-semibold">{fees.serviceFee.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Fee:</span>
            <span className="font-semibold">{fees.platformFee.toFixed(2)} {currency}</span>
          </div>
          <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total Amount:</span>
            <span className="text-lg font-bold text-blue-600">{(amount + fees.total).toFixed(2)} {currency}</span>
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
        {/* Currency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="currency"
                value="ETB"
                checked={currency === 'ETB'}
                onChange={(e) => {
                  setCurrency(e.target.value as Currency);
                  setPaymentMethod('telebirr'); // Reset to default for ETB
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">Birr (ETB)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="currency"
                value="USD"
                checked={currency === 'USD'}
                onChange={(e) => {
                  setCurrency(e.target.value as Currency);
                  setPaymentMethod('paypal'); // Reset to default for USD
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">USD</span>
            </label>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Payment Method <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-4">Select a secure method to complete your payment</p>
          
          {currency === 'ETB' ? (
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="telebirr"
                  checked={paymentMethod === 'telebirr'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Telebirr</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Bank Transfer</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Card</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_app"
                  checked={paymentMethod === 'bank_app'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Bank App</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Wallet</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="chapa"
                  checked={paymentMethod === 'chapa'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Chapa</span>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">PayPal</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Stripe</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="visa_mastercard"
                  checked={paymentMethod === 'visa_mastercard'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Visa/MasterCard</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="international_bank_transfer"
                  checked={paymentMethod === 'international_bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">International Bank Transfer</span>
              </label>
            </div>
          )}
        </div>

        {/* Payment Details based on method */}
        {(paymentMethod === 'bank_transfer' || paymentMethod === 'international_bank_transfer') && (
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

        {/* Payment Details for ETB methods */}
        {(paymentMethod === 'telebirr' || paymentMethod === 'wallet' || paymentMethod === 'chapa') && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Payment Instructions:</strong>
              </p>
              <p className="text-sm text-blue-700">
                Please complete the payment via {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} and upload proof of payment below.
              </p>
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
                label="Payment Proof (Screenshot/Receipt)"
                value={paymentDetails.paymentProof}
                onChange={(path) => setPaymentDetails(prev => ({ ...prev, paymentProof: path }))}
                accept="image/*,.pdf"
              />
            </div>
          </>
        )}

        {(paymentMethod === 'card' || paymentMethod === 'bank_app') && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Payment Instructions:</strong>
              </p>
              <p className="text-sm text-blue-700">
                Please complete the payment via {paymentMethod === 'card' ? 'Card' : 'Bank App'} and upload proof of payment below.
              </p>
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
                label="Payment Proof (Receipt)"
                value={paymentDetails.paymentProof}
                onChange={(path) => setPaymentDetails(prev => ({ ...prev, paymentProof: path }))}
                accept="image/*,.pdf"
              />
            </div>
          </>
        )}

        {/* Payment Details for USD methods */}
        {(paymentMethod === 'paypal' || paymentMethod === 'stripe' || paymentMethod === 'visa_mastercard') && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Payment Instructions:</strong>
              </p>
              <p className="text-sm text-blue-700">
                Please complete the payment via {paymentMethod === 'visa_mastercard' ? 'Visa/MasterCard' : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} and upload proof of payment below.
              </p>
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
                label="Payment Proof (Receipt)"
                value={paymentDetails.paymentProof}
                onChange={(path) => setPaymentDetails(prev => ({ ...prev, paymentProof: path }))}
                accept="image/*,.pdf"
              />
            </div>
          </>
        )}

        {/* Notes */}
        {(
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


