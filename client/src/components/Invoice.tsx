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

  const handleDownloadPDF = () => {
    // Create a downloadable invoice PDF (HTML format optimized for PDF conversion)
    if (!transaction) return;
    
    const invoice = {
      invoiceNumber: transaction.invoiceNumber,
      invoiceDate: new Date(transaction.invoiceGeneratedAt || transaction.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      buyer: transaction.buyerId,
      order: transaction.orderId,
      amount: transaction.amount,
      currency: transaction.currency || 'ETB',
      fees: transaction.fees,
      paymentMethod: transaction.paymentMethod,
      paidAt: transaction.paidAt ? new Date(transaction.paidAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'N/A',
      status: transaction.status
    };

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              @page { 
                margin: 1.5cm;
                size: A4;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif; 
              padding: 40px; 
              max-width: 800px; 
              margin: 0 auto;
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px;
              border-bottom: 4px solid #2563eb;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #2563eb; 
              margin: 0;
              font-size: 36px;
              font-weight: bold;
            }
            .header h2 {
              color: #1e40af;
              margin: 10px 0 0 0;
              font-size: 28px;
              font-weight: 600;
            }
            .invoice-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
            }
            .section { 
              margin-bottom: 30px;
            }
            .section h3 {
              color: #1e40af;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .section-content {
              background: #f9fafb;
              padding: 15px;
              border-radius: 6px;
              line-height: 1.8;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th, td { 
              padding: 14px; 
              text-align: left; 
              border-bottom: 1px solid #e5e7eb;
            }
            th { 
              background-color: #2563eb;
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.5px;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .total-row {
              background-color: #eff6ff;
              font-weight: bold;
            }
            .total-row td {
              font-size: 18px;
              color: #1e40af;
              padding: 18px 14px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            .footer p {
              margin: 5px 0;
            }
            .company-info {
              margin-top: 30px;
              text-align: center;
              color: #4b5563;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Acha Delivery Services</h1>
            <h2>INVOICE</h2>
          </div>
          
          <div class="invoice-info">
            <div>
              <div class="info-item">
                <div class="info-label">Invoice Number</div>
                <div class="info-value">${invoice.invoiceNumber}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Invoice Date</div>
                <div class="info-value">${invoice.invoiceDate}</div>
              </div>
            </div>
            <div>
              <div class="info-item">
                <div class="info-label">Payment Date</div>
                <div class="info-value">${invoice.paidAt}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Payment Method</div>
                <div class="info-value">${invoice.paymentMethod.replace(/_/g, ' ').toUpperCase()}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3>Bill To:</h3>
            <div class="section-content">
              <strong>${invoice.buyer?.name || 'N/A'}</strong><br>
              ${invoice.buyer?.email || ''}<br>
              ${invoice.buyer?.phone || ''}
            </div>
          </div>
          
          <div class="section">
            <h3>Order Details:</h3>
            <div class="section-content">
              <strong>Order ID:</strong> ${invoice.order?.uniqueId || invoice.order?._id || 'N/A'}<br>
              <strong>Product:</strong> ${invoice.order?.orderInfo?.productName || 'N/A'}<br>
              <strong>Delivery Method:</strong> ${invoice.order?.deliveryMethod || 'N/A'}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Item Value</td>
                <td style="text-align: right;">${(invoice.amount - (invoice.fees?.total || 0)).toFixed(2)} ${invoice.currency}</td>
              </tr>
              <tr>
                <td>Delivery Fee</td>
                <td style="text-align: right;">${invoice.fees?.deliveryFee?.toFixed(2) || '0.00'} ${invoice.currency}</td>
              </tr>
              <tr>
                <td>Service Fee</td>
                <td style="text-align: right;">${invoice.fees?.serviceFee?.toFixed(2) || '0.00'} ${invoice.currency}</td>
              </tr>
              <tr>
                <td>Platform Fee</td>
                <td style="text-align: right;">${invoice.fees?.platformFee?.toFixed(2) || '0.00'} ${invoice.currency}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL</td>
                <td style="text-align: right;">${invoice.amount.toFixed(2)} ${invoice.currency}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p><strong>Thank you for using Acha Delivery Services!</strong></p>
            <p>This is an official invoice for your records.</p>
            <div class="company-info">
              <p>Acha Delivery Services - Your trusted delivery partner</p>
              <p>For inquiries, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Create blob and download
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Also open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHTML);
      printWindow.document.close();
      // Give user option to print/save as PDF
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
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
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            onClick={handleDownloadPDF}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Invoice
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


