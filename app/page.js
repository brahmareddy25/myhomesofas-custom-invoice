"use client";

import React, { useState, useEffect } from 'react';
import InvoiceHistory from './components/InvoiceHistory';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import './App.css';

const API_BASE_URL = '/api/invoices';

export default function Home() {
  const [invoices, setInvoices] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, editor, print
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Fetch all invoices from S3 database
  const fetchInvoices = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices from S3:', err);
    }
  };

  // Load from backend on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Helper to get formatted current date (DD.MM.YYYY)
  const getFormattedDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  // Helper to generate the next invoice / quotation number automatically
  const generateNextDocNo = (list, docType = 'invoice') => {
    let maxNum = 0;
    const prefix = docType === 'quotation' ? 'QTN' : 'INV';
    const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    list.forEach(inv => {
      const match = (inv.invoiceNo || '').match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `${prefix}-${maxNum + 1}`;
  };

  // Trigger New Invoice Screen
  const handleNewInvoice = () => {
    const nextInvoiceNo = generateNextDocNo(invoices, 'invoice');
    const newInv = {
      id: `inv-${Date.now()}`,
      docType: 'invoice',
      invoiceNo: nextInvoiceNo,
      invoiceDate: getFormattedDate(),
      customerName: '',
      customerPhone: '',
      customerLocation: '',
      customerGst: '',
      hasGst: false,
      gstDetails: { cgst: 9, sgst: 9, igst: 0 },
      hasTransporter: false,
      vehicleNo: '',
      items: []
    };
    setEditingInvoice(newInv);
    setCurrentView('editor');
  };

  // Trigger New Quotation Screen
  const handleNewQuotation = () => {
    const nextQuotationNo = generateNextDocNo(invoices, 'quotation');
    const newQuotation = {
      id: `qtn-${Date.now()}`,
      docType: 'quotation',
      invoiceNo: nextQuotationNo,
      invoiceDate: getFormattedDate(),
      customerName: '',
      customerPhone: '',
      customerLocation: '',
      customerGst: '',
      hasGst: false,
      gstDetails: { cgst: 9, sgst: 9, igst: 0 },
      hasTransporter: false,
      vehicleNo: '',
      items: []
    };
    setEditingInvoice(newQuotation);
    setCurrentView('editor');
  };

  // Trigger Edit Invoice / Quotation
  const handleEditInvoice = (inv) => {
    setEditingInvoice({ ...inv });
    setCurrentView('editor');
  };

  // Trigger Duplicate Invoice / Quotation
  const handleDuplicateInvoice = (inv) => {
    const docType = inv.docType === 'quotation' || (inv.invoiceNo && inv.invoiceNo.startsWith('QTN')) ? 'quotation' : 'invoice';
    const nextDocNo = generateNextDocNo(invoices, docType);
    const duplicated = {
      ...inv,
      id: `${docType === 'quotation' ? 'qtn' : 'inv'}-${Date.now()}`,
      docType: docType,
      invoiceNo: nextDocNo,
      invoiceDate: getFormattedDate(),
      // Remove any item database primary keys so they get inserted as fresh rows
      items: (inv.items || []).map(item => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        image: item.image || null
      }))
    };
    setEditingInvoice(duplicated);
    setCurrentView('editor');
  };

  // Trigger Delete Invoice / Quotation
  const handleDeleteInvoice = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete document');
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert('Error deleting document from database.');
    }
  };

  // Handle Save (Add or Update in database)
  const handleSaveInvoice = async () => {
    const isQuotation = editingInvoice?.docType === 'quotation' || (editingInvoice?.invoiceNo && editingInvoice?.invoiceNo.startsWith('QTN'));
    if (!editingInvoice.invoiceNo || !editingInvoice.customerName) {
      alert(`Please provide ${isQuotation ? 'a Quotation ID' : 'an Invoice Number'} and Customer Name.`);
      return;
    }

    const exists = invoices.some(inv => inv.id === editingInvoice.id);
    const url = exists ? `${API_BASE_URL}/${editingInvoice.id}` : API_BASE_URL;
    const method = exists ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingInvoice)
      });

      if (!response.ok) throw new Error('Failed to save document');
      
      await fetchInvoices();
      setCurrentView('dashboard');
      setEditingInvoice(null);
    } catch (err) {
      console.error(err);
      alert('Error saving document to S3 database.');
    }
  };

  // Handle Cancel Editing
  const handleCancelEdit = () => {
    setCurrentView('dashboard');
    setEditingInvoice(null);
  };

  // Trigger Print Screen View
  const handlePrintView = (inv) => {
    setEditingInvoice(inv);
    setCurrentView('print');
  };

  // Trigger actual print dialog
  const triggerPrintAction = () => {
    window.print();
  };

  return (
    <div className="app-container">
      {/* 1. Header Toolbar (Hidden in print mode) */}
      {currentView !== 'print' && (
        <header className="app-header no-print">
          <div className="logo-section">
            <img src="/logo.png" alt="MY HOME SOFAS Logo" />
            <div>
              <h1>MY HOME SOFAS</h1>
              <span>Customized &amp; Idealized</span>
            </div>
          </div>
          <div className="header-actions">
            {currentView === 'editor' && (
              <>
                <button className="btn btn-secondary" onClick={handleCancelEdit}>Back to Dashboard</button>
                <button className="btn btn-primary" onClick={handleSaveInvoice}>
                  Save {editingInvoice?.docType === 'quotation' ? 'Quotation' : 'Invoice'}
                </button>
              </>
            )}
            {currentView === 'dashboard' && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleNewInvoice}>+ Create Invoice</button>
                <button className="btn btn-accent" onClick={handleNewQuotation}>+ Create Quotation</button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* 2. Main Application Views */}
      {currentView === 'dashboard' && (
        <main className="main-content">
          <InvoiceHistory
            invoices={invoices}
            onEdit={handleEditInvoice}
            onPrint={handlePrintView}
            onDuplicate={handleDuplicateInvoice}
            onDelete={handleDeleteInvoice}
            onNewInvoice={handleNewInvoice}
            onNewQuotation={handleNewQuotation}
          />
        </main>
      )}

      {currentView === 'editor' && (
        <main className="main-content">
          <InvoiceForm
            invoice={editingInvoice}
            onChange={setEditingInvoice}
            onSave={handleSaveInvoice}
            onCancel={handleCancelEdit}
          />
        </main>
      )}

      {currentView === 'print' && (
        <div>
          {/* Controls Bar visible on screen, hidden when printing */}
          <div className="no-print" style={{
            background: '#1e293b',
            color: 'white',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                const exists = invoices.some(inv => inv.id === editingInvoice.id);
                if (exists) {
                  setCurrentView('dashboard');
                } else {
                  setCurrentView('editor');
                }
              }}>
                ⬅️ Back
              </button>
              <span style={{ fontWeight: 600 }}>Print / Save PDF Mode</span>
            </div>
            <button className="btn btn-primary" onClick={triggerPrintAction}>
              🖨️ Print / Save as PDF
            </button>
          </div>
          
          {/* Invoice rendered exactly in print-page format */}
          <div className="invoice-preview-container" style={{ background: '#f3f4f6', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <InvoicePreview invoice={editingInvoice} isPrintMode={true} />
          </div>
        </div>
      )}
    </div>
  );
}
