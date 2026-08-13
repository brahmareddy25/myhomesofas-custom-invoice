import React, { useEffect, useState } from 'react';
import { numberToIndianWords } from '../utils/numberToWords';
import { generateUPIQRCode } from '../utils/qrCode';
import '../Print.css'; // Load print layouts

export default function InvoicePreview({ invoice, isPrintMode = false }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Default values matching sample invoice details if not specified
  const company = invoice.company || {
    name: "MY HOME SOFAS",
    address: "Mallampet(V), Beside Outer Ring Road,\nQutubullapur(M),\nMedchal Dist - 500090",
    phone: "9603011999",
    email: "myhomesofashyd@gmail.com"
  };

  const payment = invoice.payment || {
    accountName: "MY HOME SOFAS CUSTOMIZED & IDEALIZED",
    accountNumber: "5020 0116 9052 45",
    accountType: "Current Account",
    bank: "HDFC Bank",
    ifsc: "HDFC0001021",
    branch: "MIYAPUR",
    upiId: "MYHOMESOFASCUSTOMIZE.42990891@HDFCBANK"
  };

  const items = invoice.items || [];
  const hasGst = !!invoice.hasGst;
  const gstDetails = invoice.gstDetails || { cgst: 0, sgst: 0, igst: 0 };
  const hasTransporter = !!invoice.hasTransporter;
  const vehicleNo = invoice.vehicleNo || '';

  // Calculate items subtotal
  const subTotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0);

  // Calculate GST amounts
  const cgstAmount = hasGst ? (subTotal * parseFloat(gstDetails.cgst || 0)) / 100 : 0;
  const sgstAmount = hasGst ? (subTotal * parseFloat(gstDetails.sgst || 0)) / 100 : 0;
  const igstAmount = hasGst ? (subTotal * parseFloat(gstDetails.igst || 0)) / 100 : 0;
  
  const grandTotal = subTotal + cgstAmount + sgstAmount + igstAmount;

  // Format currency in Indian Rupees format (e.g., 1,35,000.00)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Generate UPI QR Code URL when grandTotal or UPI ID changes
  useEffect(() => {
    let active = true;
    if (payment.upiId) {
      // standard UPI payment URL setup: deep link to payment
      generateUPIQRCode(payment.upiId, grandTotal.toFixed(2), company.name)
        .then(url => {
          if (active) setQrCodeUrl(url);
        });
    }
    return () => { active = false; };
  }, [payment.upiId, grandTotal, company.name]);

  const amountInWordsStr = numberToIndianWords(grandTotal);
  const isQuotation = invoice.docType === 'quotation' || (invoice.invoiceNo && invoice.invoiceNo.startsWith('QTN'));

  return (
    <div className={isPrintMode ? "print-page" : "screen-page"}>
      {/* 1. Header Section */}
      <div className="invoice-header">
        <div className="header-logo-box">
          <img src="/logo.png" alt="MY HOME SOFAS Logo" className="company-logo" />
        </div>
        <div className="header-details-box">
          <h2 className="company-name">{company.name}</h2>
          <p className="company-text">{company.address}</p>
          <div className="company-contact">
            <span>📞 {company.phone}</span>
            <span>✉️ {company.email}</span>
          </div>
          <div className="company-gst">
            GSTIN: 36ATMPC6443J2ZG
          </div>
        </div>
        <div className="header-title-box">
          <h1 className="invoice-title">{isQuotation ? 'QUOTATION' : 'INVOICE'}</h1>
        </div>
      </div>

      {/* 2. Metadata Section (Bill To / Quotation For & Document Details) */}
      <div className="invoice-meta-section">
        <div className="bill-to-box">
          <div className="section-label">{isQuotation ? 'Quotation For' : 'Bill To'}</div>
          <h3 className="customer-name">{invoice.customerName || '—'}</h3>
          {invoice.customerPhone && (
            <p className="customer-phone">📞 {invoice.customerPhone}</p>
          )}
          <p className="customer-location">{invoice.customerLocation || '—'}</p>
          {invoice.customerGst && (
            <p className="customer-gst">GSTIN: {invoice.customerGst}</p>
          )}
        </div>
        <div className="meta-info-box">
          <div className="meta-row">
            <span className="meta-label">{isQuotation ? 'Quotation#:' : 'Invoice#:'}</span>
            <span className="meta-val">{invoice.invoiceNo || '—'}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">{isQuotation ? 'Quotation Date:' : 'Invoice Date:'}</span>
            <span className="meta-val">{invoice.invoiceDate || '—'}</span>
          </div>
          {hasTransporter && vehicleNo && (
            <div className="meta-row">
              <span className="meta-label">Vehicle No:</span>
              <span className="meta-val">{vehicleNo}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Table Section */}
      <div className="invoice-table-container">
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-desc">Description</th>
              <th className="col-qty">Qty</th>
              <th className="col-price">{isQuotation ? 'Quotation Amount' : 'Price'}</th>
              <th className="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const itemTotal = parseFloat(item.price || 0) * parseFloat(item.quantity || 0);
              return (
                <tr key={idx}>
                  <td className="col-num">{idx + 1}</td>
                  <td className="col-desc">
                    <div className="item-desc-wrapper">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name || 'Product'} 
                          className="item-product-img" 
                        />
                      )}
                      <div className="item-text-content">
                        <p className="item-name">{item.name}</p>
                        {item.description && <p className="item-desc">{item.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="col-qty">
                    <span className="qty-val">{item.quantity}</span>
                    <span className="qty-unit">{item.unit || 'Nos'}</span>
                  </td>
                  <td className="col-price">{formatCurrency(item.price)}</td>
                  <td className="col-total">{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Totals and Words Section */}
      <div className="totals-section">
        <div className="amount-words-box">
          <div className="words-label">Amount in words:</div>
          <div className="words-content">{amountInWordsStr}</div>
        </div>
        <div className="grand-total-box">
          {hasGst && (
            <>
              <div className="total-calc-row">
                <span className="total-calc-label">Sub Total:</span>
                <span className="total-calc-val">{formatCurrency(subTotal)}</span>
              </div>
              {parseFloat(gstDetails.cgst || 0) > 0 && (
                <div className="total-calc-row">
                  <span className="total-calc-label">CGST ({gstDetails.cgst}%):</span>
                  <span className="total-calc-val">{formatCurrency(cgstAmount)}</span>
                </div>
              )}
              {parseFloat(gstDetails.sgst || 0) > 0 && (
                <div className="total-calc-row">
                  <span className="total-calc-label">SGST ({gstDetails.sgst}%):</span>
                  <span className="total-calc-val">{formatCurrency(sgstAmount)}</span>
                </div>
              )}
              {parseFloat(gstDetails.igst || 0) > 0 && (
                <div className="total-calc-row">
                  <span className="total-calc-label">IGST ({gstDetails.igst}%):</span>
                  <span className="total-calc-val">{formatCurrency(igstAmount)}</span>
                </div>
              )}
            </>
          )}
          <div className="grand-total-row">
            <span className="grand-label">{isQuotation ? 'Total Amount' : 'Grand Total'}</span>
            <span className="grand-val">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* 5. Footer (Payments & QR, and Authorised Signatures) */}
      <div className="invoice-footer">
        <div className="payment-instructions">
          <div className="payment-details">
            <div className="payment-title">Payment Instructions</div>
            <p className="payment-line"><span className="payment-label">Account Name:</span> <span className="payment-val">{payment.accountName}</span></p>
            <p className="payment-line"><span className="payment-label">Account No:</span> <span className="payment-val">{payment.accountNumber}</span></p>
            {payment.accountType && (
              <p className="payment-line"><span className="payment-label">Account Type:</span> <span className="payment-val">{payment.accountType}</span></p>
            )}
            <p className="payment-line"><span className="payment-label">Bank Name:</span> <span className="payment-val">{payment.bank}</span></p>
            <p className="payment-line"><span className="payment-label">IFSC Code:</span> <span className="payment-val">{payment.ifsc}</span></p>
            <p className="payment-line"><span className="payment-label">Branch:</span> <span className="payment-val">{payment.branch}</span></p>
            <p className="payment-line upi-line"><span className="payment-label">UPI ID:</span> <span className="payment-val">{payment.upiId}</span></p>
          </div>
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="UPI Payment QR Code" className="qr-code-img" />
          )}
        </div>
        <div className="signature-box">
          <div className="signature-for">For, {company.name}</div>
          <div className="signature-space"></div>
          <div className="signature-title">Authorized Signature</div>
        </div>
      </div>
    </div>
  );
}
