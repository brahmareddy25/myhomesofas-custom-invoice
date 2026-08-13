import React, { useState } from 'react';
import InvoicePreview from './InvoicePreview';

// Helper to convert DD.MM.YYYY to YYYY-MM-DD for native input
const formatDateToISO = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
};

// Helper to convert YYYY-MM-DD to DD.MM.YYYY for invoice A4 layout
const formatISOToDisplay = (isoStr) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoStr;
};


export default function InvoiceForm({ invoice, onChange, onSave, onCancel }) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const isQuotation = invoice.docType === 'quotation' || (invoice.invoiceNo && invoice.invoiceNo.startsWith('QTN'));

  const handleMetaChange = (field, val) => {
    onChange({ ...invoice, [field]: val });
  };

  const handleGstChange = (field, val) => {
    onChange({
      ...invoice,
      gstDetails: {
        ...invoice.gstDetails,
        [field]: val
      }
    });
  };

  // Add a new empty item row
  const addItem = () => {
    const newItem = { name: '', description: '', quantity: 1, unit: 'Nos', price: 0 };
    onChange({
      ...invoice,
      items: [...(invoice.items || []), newItem]
    });
  };

  // Remove an item row
  const removeItem = (idxToRemove) => {
    const updatedItems = (invoice.items || []).filter((_, idx) => idx !== idxToRemove);
    onChange({ ...invoice, items: updatedItems });
  };

  // Update a specific field in an item row
  const updateItem = (itemIdx, field, val) => {
    const updatedItems = (invoice.items || []).map((item, idx) => {
      if (idx === itemIdx) {
        return { ...item, [field]: val };
      }
      return item;
    });
    onChange({ ...invoice, items: updatedItems });
  };

  // Helper to compress and convert image file to Base64 Data URL
  const handleImageUpload = (file, itemIdx) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        updateItem(itemIdx, 'image', dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const items = invoice.items || [];
  const gstDetails = invoice.gstDetails || { cgst: 0, sgst: 0, igst: 0 };

  return (
    <div className="focused-form-container">
      {/* Editor Headers */}
      <div className="form-header-bar">
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800 }}>
            {isQuotation ? 'Quotation Editor' : 'Invoice Editor'}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>
            {isQuotation
              ? 'Complete the fields below to create or update your quotation information.'
              : 'Complete the fields below to update your invoice information.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowPreviewModal(true)}>
            👁️ View {isQuotation ? 'Quotation' : 'Invoice'} Preview
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            Save {isQuotation ? 'Quotation' : 'Invoice'}
          </button>
        </div>
      </div>

      <div className="editor-form-panel focused-form-panel">
        {/* Document Details */}
        <div className="form-section">
          <h3 className="section-title">{isQuotation ? 'Quotation Details' : 'Invoice Details'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="invoiceNo">{isQuotation ? 'Quotation ID' : 'Invoice Number'}</label>
              <input
                id="invoiceNo"
                type="text"
                className="form-input"
                value={invoice.invoiceNo || ''}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', fontWeight: 'bold' }}
                placeholder="Automatically generated"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>
                Auto-generated next ID in sequence.
              </span>
            </div>
            <div className="form-group">
              <label htmlFor="invoiceDate">{isQuotation ? 'Quotation Date' : 'Invoice Date'}</label>
              <input
                id="invoiceDate"
                type="date"
                className="form-input"
                value={formatDateToISO(invoice.invoiceDate)}
                onChange={(e) => handleMetaChange('invoiceDate', formatISOToDisplay(e.target.value))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>
                Defaults to today's date. Click to pick a custom date.
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="form-section">
          <h3 className="section-title">Customer Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name</label>
              <input
                id="customerName"
                type="text"
                className="form-input"
                value={invoice.customerName || ''}
                onChange={(e) => handleMetaChange('customerName', e.target.value)}
                placeholder="Enter Customer Name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerPhone">Customer Phone Number</label>
              <input
                id="customerPhone"
                type="tel"
                className="form-input"
                value={invoice.customerPhone || ''}
                onChange={(e) => handleMetaChange('customerPhone', e.target.value)}
                placeholder="Enter Customer Phone Number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerLocation">Location / Address</label>
              <input
                id="customerLocation"
                type="text"
                className="form-input"
                value={invoice.customerLocation || ''}
                onChange={(e) => handleMetaChange('customerLocation', e.target.value)}
                placeholder="Enter Customer Location / Address"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerGst">Customer GSTIN (Optional)</label>
              <input
                id="customerGst"
                type="text"
                className="form-input"
                value={invoice.customerGst || ''}
                onChange={(e) => handleMetaChange('customerGst', e.target.value.toUpperCase())}
                placeholder="Enter Customer GSTIN"
              />
            </div>
          </div>
        </div>

        {/* Add ons (GST & Transporter) */}
        <div className="form-section">
          <h3 className="section-title">Add-ons & Options</h3>
          
          {/* GST Option Toggle */}
          <label className="toggle-group">
            <input
              type="checkbox"
              className="toggle-input"
              checked={!!invoice.hasGst}
              onChange={(e) => handleMetaChange('hasGst', e.target.checked)}
            />
            <div className="toggle-switch"></div>
            <span className="toggle-label">Enable GST Taxes</span>
          </label>

          {invoice.hasGst && (
            <div className="form-grid-3" style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div className="form-group">
                <label htmlFor="cgst">CGST %</label>
                <input
                  id="cgst"
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={gstDetails.cgst || 0}
                  onChange={(e) => handleGstChange('cgst', parseFloat(e.target.value) || 0)}
                  placeholder="Enter CGST Percentage"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sgst">SGST %</label>
                <input
                  id="sgst"
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={gstDetails.sgst || 0}
                  onChange={(e) => handleGstChange('sgst', parseFloat(e.target.value) || 0)}
                  placeholder="Enter SGST Percentage"
                />
              </div>
              <div className="form-group">
                <label htmlFor="igst">IGST %</label>
                <input
                  id="igst"
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={gstDetails.igst || 0}
                  onChange={(e) => handleGstChange('igst', parseFloat(e.target.value) || 0)}
                  placeholder="Enter IGST Percentage"
                />
              </div>
            </div>
          )}

          {/* Transporter Option Toggle */}
          <label className="toggle-group">
            <input
              type="checkbox"
              className="toggle-input"
              checked={!!invoice.hasTransporter}
              onChange={(e) => handleMetaChange('hasTransporter', e.target.checked)}
            />
            <div className="toggle-switch"></div>
            <span className="toggle-label">Include Transporter Vehicle Info</span>
          </label>

          {invoice.hasTransporter && (
            <div className="form-group" style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <label htmlFor="vehicleNo">Vehicle Number</label>
              <input
                id="vehicleNo"
                type="text"
                className="form-input"
                value={invoice.vehicleNo || ''}
                onChange={(e) => handleMetaChange('vehicleNo', e.target.value)}
                placeholder="Enter Vehicle Number"
              />
            </div>
          )}
        </div>

        {/* Items / Products Section */}
        <div className="form-section">
          <div className="section-title">
            <span>{isQuotation ? 'Products / Quotation Items' : 'Items Details'}</span>
            <button className="btn btn-secondary btn-sm" onClick={addItem}>
              {isQuotation ? '+ Add Product' : '+ Add Item'}
            </button>
          </div>

          <div className="items-builder">
            {items.map((item, idx) => (
              <div key={idx} className="item-row-card">
                <div className="item-row-header">
                  <span>{isQuotation ? `Product #${idx + 1}` : `Item #${idx + 1}`}</span>
                  <button className="btn-remove-item" onClick={() => removeItem(idx)}>Remove</button>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>{isQuotation ? 'Product Name' : 'Item Name'}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.name || ''}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      placeholder={isQuotation ? "Enter Product Name" : "Enter Item Name"}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.unit || ''}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      placeholder="Enter Unit (e.g. Nos, Set)"
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={item.quantity || 1}
                      onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Enter Quantity"
                    />
                  </div>
                  <div className="form-group">
                    <label>{isQuotation ? 'Quotation Amount (₹)' : 'Unit Price (₹)'}</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={item.price || 0}
                      onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                      placeholder={isQuotation ? "Enter Quotation Amount" : "Enter Price"}
                    />
                  </div>
                  <div className="form-group">
                    <label>Subtotal (₹)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ background: '#f1f5f9', fontWeight: 'bold' }}
                      value={(parseFloat(item.price || 0) * parseFloat(item.quantity || 0)).toFixed(2)}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{isQuotation ? 'Product Description / Details' : 'Description / Details'}</label>
                  <textarea
                    className="form-input"
                    value={item.description || ''}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder={isQuotation ? "Enter Product Description / Specifications / Warranty" : "Enter Item Details / Warranty / Dimensions"}
                  ></textarea>
                </div>

                {isQuotation && (
                  <div className="form-group" style={{ marginTop: '0.25rem' }}>
                    <label>Product Photo (Camera / Upload)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {item.image ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <img 
                            src={item.image} 
                            alt="Product Preview" 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                              📷 Change Photo
                              <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                style={{ display: 'none' }} 
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleImageUpload(e.target.files[0], idx);
                                }} 
                              />
                            </label>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-sm" 
                              onClick={() => updateItem(idx, 'image', null)}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                          📷 Take Photo / Upload Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            style={{ display: 'none' }} 
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleImageUpload(e.target.files[0], idx);
                            }} 
                          />
                        </label>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        Take a picture with your camera or select an image from your device.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="empty-state">
                <span>No items added yet. Click &quot;{isQuotation ? '+ Add Product' : '+ Add Item'}&quot; above to add products.</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowPreviewModal(true)}>
            👁️ View {isQuotation ? 'Quotation' : 'Invoice'} Preview
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            Save {isQuotation ? 'Quotation' : 'Invoice'}
          </button>
        </div>
      </div>

      {/* Preview Modal Dialog */}
      {showPreviewModal && (
        <div className="modal-overlay no-print" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800 }}>
                {isQuotation ? 'Quotation PDF Layout Preview' : 'Invoice PDF Layout Preview'}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setShowPreviewModal(false);
                  window.print();
                }}>
                  🖨️ Print / Save PDF
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPreviewModal(false)}>
                  Close
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="invoice-preview-container" style={{ padding: '0', background: 'white' }}>
                <InvoicePreview invoice={invoice} isPrintMode={false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
