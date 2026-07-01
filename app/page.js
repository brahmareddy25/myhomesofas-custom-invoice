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

  // Helper to generate the next invoice number automatically
  const generateNextInvoiceNo = (list) => {
    let maxNum = 0;
    list.forEach(inv => {
      const match = (inv.invoiceNo || '').match(/^INV-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `INV-${maxNum + 1}`;
  };

  // Trigger New Invoice Screen
  const handleNewInvoice = () => {
    const nextInvoiceNo = generateNextInvoiceNo(invoices);
    const newInv = {
      id: `inv-${Date.now()}`,
      invoiceNo: nextInvoiceNo,
      invoiceDate: getFormattedDate(),
      customerName: '',
      customerLocation: '',
      hasGst: false,
      gstDetails: { cgst: 9, sgst: 9, igst: 0 },
      hasTransporter: false,
      vehicleNo: '',
      items: []
    };
    setEditingInvoice(newInv);
    setCurrentView('editor');
  };

  // Trigger Edit Invoice
  const handleEditInvoice = (inv) => {
    setEditingInvoice({ ...inv });
    setCurrentView('editor');
  };

  // Trigger Duplicate Invoice
  const handleDuplicateInvoice = (inv) => {
    const nextInvoiceNo = generateNextInvoiceNo(invoices);
    const duplicated = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNo: nextInvoiceNo,
      invoiceDate: getFormattedDate(),
      // Remove any item database primary keys so they get inserted as fresh rows
      items: (inv.items || []).map(item => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price
      }))
    };
    setEditingInvoice(duplicated);
    setCurrentView('editor');
  };

  // Trigger Delete Invoice
  const handleDeleteInvoice = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete invoice');
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert('Error deleting invoice from database.');
    }
  };

  // Handle Save (Add or Update in database)
  const handleSaveInvoice = async () => {
    if (!editingInvoice.invoiceNo || !editingInvoice.customerName) {
      alert("Please provide an Invoice Number and Customer Name.");
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

      if (!response.ok) throw new Error('Failed to save invoice');
      
      await fetchInvoices();
      setCurrentView('dashboard');
      setEditingInvoice(null);
    } catch (err) {
      console.error(err);
      alert('Error saving invoice to S3 database.');
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
              <span>Customized & Idealized</span>
            </div>
          </div>
          <div className="header-actions">
            {currentView === 'editor' && (
              <>
                <button className="btn btn-secondary" onClick={handleCancelEdit}>Back to Dashboard</button>
                <button className="btn btn-primary" onClick={handleSaveInvoice}>Save Invoice</button>
              </>
            )}
            {currentView === 'dashboard' && (
              <button className="btn btn-primary" onClick={handleNewInvoice}>+ Create Invoice</button>
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
