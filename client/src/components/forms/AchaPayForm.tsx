import { useState } from 'react';
import FileUpload from '../FileUpload';
import { api } from '../../services/api';

function AchaPayForm() {
  const [formData, setFormData] = useState({
    amount: '',
    conversionRate: '',
    bankAccountHolderName: '',
    bankAccountNumber: '',
    bankName: '',
    photo: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculate derived values
  const amount = parseFloat(formData.amount) || 0;
  const processingFee = amount * 0.20; // 20% of amount
  const totalDeposit = amount + processingFee;
  const conversionRate = parseFloat(formData.conversionRate) || 0;
  const payment = conversionRate * amount;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue >= 25 && numValue <= 2600;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Form validation
    if (!validateAmount(formData.amount)) {
      setMessage({ type: 'error', text: 'Amount must be between USD 25 and USD 2600' });
      setLoading(false);
      return;
    }
    if (!conversionRate || conversionRate <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid conversion rate' });
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        amount: parseFloat(formData.amount),
        processingFee,
        totalDeposit,
        conversionRate: parseFloat(formData.conversionRate),
        payment,
        bankAccountHolderName: formData.bankAccountHolderName,
        bankAccountNumber: formData.bankAccountNumber,
        bankName: formData.bankName,
        photo: formData.photo,
        status: 'pending'
      };

      const response = await api.achaPay.create(submitData) as { status?: string; message?: string; data?: any };
      
      if (response.status === 'success' || response) {
        setMessage({ 
          type: 'success', 
          text: 'Acha Pay deposit request submitted successfully! We will process your payment shortly.' 
        });
        
        // Reset form
        setFormData({
          amount: '',
          conversionRate: '',
          bankAccountHolderName: '',
          bankAccountNumber: '',
          bankName: '',
          photo: ''
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to submit payment request. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Acha Pay Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Acha Pay</h2>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount (USD)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="25"
              max="2600"
              step="0.01"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-400"
              placeholder="Enter amount"
            />
            <p className="text-xs text-gray-500 mt-1">Limit: USD 25 to USD 2600</p>
            {formData.amount && !validateAmount(formData.amount) && (
              <p className="text-xs text-red-600 mt-1">Amount must be between USD 25 and USD 2600</p>
            )}
          </div>

          {/* Processing Fee - Display Only */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Processing Fee:</span>
              <span className="text-sm font-semibold text-gray-900">
                {processingFee.toFixed(2)} USD
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">20% of Amount</p>
          </div>

          {/* Total Deposit - Display Only */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Deposit:</span>
              <span className="text-lg font-bold text-green-700">
                {totalDeposit.toFixed(2)} USD
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Amount + Processing Fee</p>
          </div>

          {/* Conversion Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Conversion Rate
            </label>
            <input
              type="number"
              name="conversionRate"
              value={formData.conversionRate}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-400"
              placeholder="Enter conversion rate"
            />
            <p className="text-xs text-gray-500 mt-1">1 USD = X Birr</p>
          </div>

          {/* Payment - Display Only */}
          {conversionRate > 0 && amount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Payment:</span>
                <span className="text-lg font-bold text-blue-700">
                  {payment.toFixed(2)} Birr
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Conversion Rate ({conversionRate}) × Amount ({amount} USD)</p>
            </div>
          )}

          {/* Bank Account Holder Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Account Holder Name
            </label>
            <input
              type="text"
              name="bankAccountHolderName"
              value={formData.bankAccountHolderName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-400"
              placeholder="Enter bank account holder name"
            />
          </div>

          {/* Bank Account Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Account Number
            </label>
            <input
              type="text"
              name="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-400"
              placeholder="Enter bank account number"
            />
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Name
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-400"
              placeholder="Enter bank name"
            />
          </div>

          {/* Attach Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attach Photo
            </label>
            <FileUpload
              label=""
              value={formData.photo}
              onChange={(value) => setFormData(prev => ({ ...prev, photo: value }))}
              accept="image/*"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !validateAmount(formData.amount) || !conversionRate || !formData.bankAccountHolderName || !formData.bankAccountNumber || !formData.bankName || !formData.photo}
            className="w-full py-3 px-5 rounded-lg text-white font-semibold text-base transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #14b8a6 100%)' }}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AchaPayForm;

