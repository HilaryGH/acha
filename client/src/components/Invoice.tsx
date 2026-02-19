import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface InvoiceProps {
  transactionId: string;
  onClose?: () => void;
}

function Invoice({ transactionId, onClose }: InvoiceProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoice();
  }, [transactionId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.transactions.generateInvoice(transactionId) as { status?: string; data?: any; message?: string };
      if (response.status === 'success') {
        setTransaction(response.data.transaction);
      } else {
        setError(response.message || 'Failed to load invoice');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a downloadable PDF version
    const printWindow = window.open('', '_blank');
    if (printWindow && transaction) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${transaction.invoiceNumber}</title>
            <meta charset="utf-8">
            <style>
              @media print {
                @page { margin: 1cm; }
              }
              body { 
                font-family: Arial, sans-serif; 
                padding: 40px; 
                max-width: 800px; 
                margin: 0 auto;
                color: #333;
              }
              .header { 
                text-align: center; 
                margin-bottom: 40px;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
              }
              .header h1 {
                color: #2563eb;
                margin: 0;
                font-size: 32px;
              }
              .header h2 {
                color: #1e40af;
                margin: 10px 0 0 0;
                font-size: 24px;
              }
              .invoice-details { 
                margin-bottom: 30px;
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
              }
              .invoice-details p {
                margin: 5px 0;
              }
              .section { 
                margin-bottom: 25px;
              }
              .section h3 {
                color: #1e40af;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 5px;
                margin-bottom: 15px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px;
                background: white;
              }
              th, td { 
                padding: 12px; 
                text-align: left; 
                border-bottom: 1px solid #e5e7eb;
              }
              th { 
                background-color: #2563eb;
                color: white;
                font-weight: 600;
              }
              tr:hover {
                background-color: #f8fafc;
              }
              .total { 
                font-weight: bold; 
                font-size: 1.3em;
                color: #1e40af;
              }
              .total-row {
                background-color: #eff6ff;
                font-weight: bold;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            ${generateInvoiceHTML(transaction)}
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Acha Delivery Services - Your trusted delivery partner</p>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleDownloadPDF = () => {
    // Alternative: Download as HTML file that can be converted to PDF
    if (!transaction) return;
    
    const htmlContent = generateInvoiceHTML(transaction);
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${transaction.invoiceNumber}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
            .header h1 { color: #2563eb; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #2563eb; color: white; }
            .total { font-weight: bold; font-size: 1.3em; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${transaction.invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateInvoiceHTML = (trans: any) => {
    if (!trans) return '';
    
    const invoice = {
      invoiceNumber: trans.invoiceNumber,
      invoiceDate: new Date(trans.invoiceGeneratedAt).toLocaleDateString(),
      buyer: trans.buyerId,
      order: trans.orderId,
      amount: trans.amount,
      currency: trans.currency,
      fees: trans.fees,
      paymentMethod: trans.paymentMethod,
      paidAt: new Date(trans.paidAt).toLocaleDateString()
    };

    return `
      <div class="header">
        <h1>Acha Delivery Services</h1>
        <h2>INVOICE</h2>
      </div>
      
      <div class="invoice-details">
        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Invoice Date:</strong> ${invoice.invoiceDate}</p>
        <p><strong>Payment Date:</strong> ${invoice.paidAt}</p>
      </div>
      
      <div class="section">
        <h3>Bill To:</h3>
        <p>${invoice.buyer?.name || 'N/A'}<br>
        ${invoice.buyer?.email || ''}<br>
        ${invoice.buyer?.phone || ''}</p>
      </div>
      
      <div class="section">
        <h3>Order Details:</h3>
        <p><strong>Order ID:</strong> ${invoice.order?.uniqueId || invoice.order?._id || 'N/A'}</p>
        <p><strong>Product:</strong> ${invoice.order?.orderInfo?.productName || 'N/A'}</p>
        <p><strong>Delivery Method:</strong> ${invoice.order?.deliveryMethod || 'N/A'}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Item Value</td>
            <td>${(invoice.amount - (invoice.fees?.total || 0)).toFixed(2)} ${invoice.currency}</td>
          </tr>
          <tr>
            <td>Delivery Fee</td>
            <td>${invoice.fees?.deliveryFee?.toFixed(2) || '0.00'} ${invoice.currency}</td>
          </tr>
          <tr>
            <td>Service Fee</td>
            <td>${invoice.fees?.serviceFee?.toFixed(2) || '0.00'} ${invoice.currency}</td>
          </tr>
          <tr>
            <td>Platform Fee</td>
            <td>${invoice.fees?.platformFee?.toFixed(2) || '0.00'} ${invoice.currency}</td>
          </tr>
          <tr class="total">
            <td>Total</td>
            <td>${invoice.amount.toFixed(2)} ${invoice.currency}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="section">
        <p><strong>Payment Method:</strong> ${invoice.paymentMethod.replace('_', ' ').toUpperCase()}</p>
      </div>
      
      <div class="section" style="margin-top: 50px;">
        <p>Thank you for using Acha Delivery Services!</p>
        <p style="margin-top: 10px; font-size: 12px;">TIN: XXX</p>
      </div>
    `;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading invoice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  const invoice = {
    invoiceNumber: transaction.invoiceNumber,
    invoiceDate: new Date(transaction.invoiceGeneratedAt).toLocaleDateString(),
    buyer: transaction.buyerId,
    order: transaction.orderId,
    amount: transaction.amount,
    currency: transaction.currency,
    fees: transaction.fees,
    paymentMethod: transaction.paymentMethod,
    paidAt: new Date(transaction.paidAt).toLocaleDateString()
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 print:p-4">
      {/* Print-only header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-3xl font-bold">Acha Delivery Services</h1>
        <h2 className="text-2xl font-semibold mt-2">INVOICE</h2>
      </div>

      {/* Action buttons - hidden when printing */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-semibold text-gray-900">Invoice</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Print
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            onClick={handleDownloadPDF}
          >
            Download PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Number</h3>
          <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Date</h3>
          <p className="text-lg font-semibold">{invoice.invoiceDate}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Date</h3>
          <p className="text-lg font-semibold">{invoice.paidAt}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h3>
          <p className="text-lg font-semibold capitalize">{invoice.paymentMethod.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="font-semibold">{invoice.buyer?.name || 'N/A'}</p>
          <p className="text-gray-600">{invoice.buyer?.email || ''}</p>
          <p className="text-gray-600">{invoice.buyer?.phone || ''}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details:</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p><strong>Order ID:</strong> {invoice.order?.uniqueId || invoice.order?._id || 'N/A'}</p>
          <p><strong>Product:</strong> {invoice.order?.orderInfo?.productName || 'N/A'}</p>
          <p><strong>Delivery Method:</strong> {invoice.order?.deliveryMethod || 'N/A'}</p>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3">Item Value</td>
              <td className="px-4 py-3 text-right">{(invoice.amount - (invoice.fees?.total || 0)).toFixed(2)} {invoice.currency}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3">Delivery Fee</td>
              <td className="px-4 py-3 text-right">{invoice.fees?.deliveryFee?.toFixed(2) || '0.00'} {invoice.currency}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3">Service Fee</td>
              <td className="px-4 py-3 text-right">{invoice.fees?.serviceFee?.toFixed(2) || '0.00'} {invoice.currency}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3">Platform Fee</td>
              <td className="px-4 py-3 text-right">{invoice.fees?.platformFee?.toFixed(2) || '0.00'} {invoice.currency}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="px-4 py-4 text-lg font-bold">Total</td>
              <td className="px-4 py-4 text-right text-lg font-bold text-blue-600">
                {invoice.amount.toFixed(2)} {invoice.currency}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
        <p>Thank you for using Acha Delivery Services!</p>
        <p className="mt-2 text-sm">TIN: XXX</p>
        <p className="mt-2 text-sm">For inquiries, please contact our support team.</p>
      </div>
    </div>
  );
}

export default Invoice;


