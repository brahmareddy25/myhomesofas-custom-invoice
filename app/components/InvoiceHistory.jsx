import React, { useState } from 'react';

export default function InvoiceHistory({ 
  invoices, 
  onEdit, 
  onPrint, 
  onDuplicate, 
  onDelete, 
  onNewInvoice,
  onNewQuotation 
}) {
  // Local state for filters
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all'); // all, invoice, quotation
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gstFilter, setGstFilter] = useState('all'); // all, gst, nongst
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Calculate totals helper for stats
  const getInvoiceTotals = (inv) => {
    const items = inv.items || [];
    const subTotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0);
    if (inv.hasGst) {
      const details = inv.gstDetails || { cgst: 0, sgst: 0, igst: 0 };
      const cgst = (subTotal * parseFloat(details.cgst || 0)) / 100;
      const sgst = (subTotal * parseFloat(details.sgst || 0)) / 100;
      const igst = (subTotal * parseFloat(details.igst || 0)) / 100;
      return subTotal + cgst + sgst + igst;
    }
    return subTotal;
  };

  // Convert Indian Rupees Format
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format standard date strings (DD.MM.YYYY) into sortable JS Dates for filtering
  const parseInvoiceDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return new Date(dateStr);
  };

  // Helper to check if a document is a quotation
  const checkIsQuotation = (inv) => {
    return inv.docType === 'quotation' || (inv.invoiceNo && inv.invoiceNo.startsWith('QTN'));
  };

  // 1. Calculate General Stats
  const totalDocs = invoices.length;
  const invoicesCount = invoices.filter(inv => !checkIsQuotation(inv)).length;
  const quotationsCount = invoices.filter(inv => checkIsQuotation(inv)).length;
  const totalValue = invoices.reduce((sum, inv) => sum + getInvoiceTotals(inv), 0);
  const gstCount = invoices.filter(inv => inv.hasGst).length;

  // 2. Filter Invoices & Quotations
  const filteredInvoices = invoices.filter(inv => {
    const isQuot = checkIsQuotation(inv);

    // Document Type filter
    if (docTypeFilter === 'invoice' && isQuot) return false;
    if (docTypeFilter === 'quotation' && !isQuot) return false;

    // Search filter
    const matchesSearch = 
      (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerPhone || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerLocation || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoiceNo || '').toLowerCase().includes(search.toLowerCase());
    
    // Date filter
    const invDate = parseInvoiceDate(inv.invoiceDate);
    const matchesStart = startDate ? invDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? invDate <= new Date(endDate) : true;

    // GST filter
    const matchesGst = 
      gstFilter === 'all' ? true :
      gstFilter === 'gst' ? !!inv.hasGst : !inv.hasGst;

    // Amount filter
    const total = getInvoiceTotals(inv);
    const matchesMin = minAmount ? total >= parseFloat(minAmount) : true;
    const matchesMax = maxAmount ? total <= parseFloat(maxAmount) : true;

    return matchesSearch && matchesStart && matchesEnd && matchesGst && matchesMin && matchesMax;
  });

  return (
    <div className="dashboard-grid">
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-dark)' }}>
            Invoice &amp; Quotation History
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Manage invoices and quotations, track business statistics, and print A4 PDF documents.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onNewInvoice}>
            + Create New Invoice
          </button>
          <button className="btn btn-accent" onClick={onNewQuotation}>
            + Create New Quotation
          </button>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Invoices</span>
          <span className="stat-value">{invoicesCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Quotations</span>
          <span className="stat-value" style={{ color: '#0d9488' }}>{quotationsCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Document Value</span>
          <span className="stat-value">{formatCurrency(totalValue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">GST Tax Invoices</span>
          <span className="stat-value">{gstCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500 }}>({totalDocs > 0 ? Math.round((gstCount / totalDocs) * 100) : 0}%)</span></span>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="filters-panel">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            className="filter-control"
            placeholder="Search name / phone / ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Document Type</label>
          <select
            className="filter-control"
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
          >
            <option value="all">All Documents ({totalDocs})</option>
            <option value="invoice">Invoices Only ({invoicesCount})</option>
            <option value="quotation">Quotations Only ({quotationsCount})</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            className="filter-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            className="filter-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>GST Status</label>
          <select
            className="filter-control"
            value={gstFilter}
            onChange={(e) => setGstFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="gst">With GST Only</option>
            <option value="nongst">Without GST Only</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Min Amount (₹)</label>
          <input
            type="number"
            className="filter-control"
            placeholder="Min Total"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
        </div>
      </div>

      {/* History Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Document ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Customer Details</th>
              <th>Items</th>
              <th>Tax</th>
              <th>Total Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv, idx) => {
              const total = getInvoiceTotals(inv);
              const itemsCount = (inv.items || []).length;
              const isQuot = checkIsQuotation(inv);
              return (
                <tr key={inv.id || idx}>
                  <td>
                    <span className={isQuot ? "invoice-id-badge quotation-id-badge" : "invoice-id-badge"}>
                      {inv.invoiceNo}
                    </span>
                  </td>
                  <td>
                    <span className={isQuot ? "badge badge-quotation" : "badge badge-invoice"}>
                      {isQuot ? "QUOTATION" : "INVOICE"}
                    </span>
                  </td>
                  <td>{inv.invoiceDate}</td>
                  <td>
                    <div className="customer-info-cell">
                      <span className="cust-name">{inv.customerName}</span>
                      {inv.customerPhone && (
                        <span className="cust-phone">📞 {inv.customerPhone}</span>
                      )}
                      <span className="cust-loc">{inv.customerLocation}</span>
                    </div>
                  </td>
                  <td>
                    {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                  </td>
                  <td>
                    {inv.hasGst ? (
                      <span className="badge badge-gst">GST</span>
                    ) : (
                      <span className="badge badge-nongst">Non-GST</span>
                    )}
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>
                    {formatCurrency(total)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onPrint(inv)}
                        title="Print / Save PDF"
                      >
                        🖨️ Print
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit(inv)}
                        title="Edit Details"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onDuplicate(inv)}
                        title="Duplicate as New"
                      >
                        📋 Copy
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${isQuot ? 'quotation' : 'invoice'} ${inv.invoiceNo}?`)) {
                            onDelete(inv.id);
                          }
                        }}
                        title="Delete Document"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                  No documents found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
