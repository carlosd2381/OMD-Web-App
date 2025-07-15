import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import AddInvoiceModal from '../../components/AddInvoiceModal';
import LogPaymentModal from '../../components/LogPaymentModal';

// --- Reusable Components for Consistent Styling ---

/**
 * A styled container for a section of the page.
 * Provides a title and an optional action button.
 */
const SectionHeader = ({ title, buttonText, onButtonClick }) => (
  <div className="flex justify-between items-center mb-4 pt-6">
    <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
    {buttonText && (
      <button 
        onClick={onButtonClick}
        className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-300"
      >
        {buttonText}
      </button>
    )}
  </div>
);

/**
 * A styled summary card for displaying key financial metrics.
 */
const SummaryCard = ({ title, value, colorClass = 'text-gray-800' }) => (
  <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center border border-gray-200">
    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

/**
 * Renders a color-coded status badge based on the invoice status.
 */
const StatusBadge = ({ status }) => {
  const baseClasses = "relative inline-block px-3 py-1 font-semibold leading-tight text-xs rounded-full";
  let colorClasses = "";

  switch (status?.toLowerCase()) {
    case 'paid':
      colorClasses = "text-green-900 bg-green-200";
      break;
    case 'pending':
    case 'sent':
      colorClasses = "text-yellow-900 bg-yellow-200";
      break;
    case 'overdue':
      colorClasses = "text-red-900 bg-red-200";
      break;
    case 'draft':
    default:
      colorClasses = "text-gray-700 bg-gray-200";
      break;
  }

  return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
};


// --- Main ClientFinancials Component ---

function ClientFinancials() {
  const { clientData } = useOutletContext();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isLogPaymentModalOpen, setIsLogPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchFinancials = useCallback(async () => {
    if (!clientData?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch invoices for the client
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('contact_id', clientData.id)
        .order('issue_date', { ascending: false });
      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // Fetch associated payments
      const invoiceIds = invoicesData?.map(inv => inv.id) || [];
      if (invoiceIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*, invoices(invoice_number)')
          .in('invoice_id', invoiceIds)
          .order('payment_date', { ascending: false });
        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);
      } else {
        setPayments([]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching financials:", err);
    } finally {
      setLoading(false);
    }
  }, [clientData]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  const handleLogPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setIsLogPaymentModalOpen(true);
  };

  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amount_paid || 0), 0);
  const balanceDue = totalInvoiced - totalPaid;

  const formatCurrency = (amount, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  if (loading) {
    return <div className="p-6">Loading financials...</div>;
  }
  
  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    // Main container for the entire financials tab
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg space-y-8">
      
      {/* --- Summary Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Total Invoiced" value={formatCurrency(totalInvoiced)} />
        <SummaryCard title="Total Paid" value={formatCurrency(totalPaid)} colorClass="text-green-600" />
        <SummaryCard title="Balance Due" value={formatCurrency(balanceDue)} colorClass={balanceDue > 0 ? 'text-red-600' : 'text-gray-800'} />
      </div>

      {/* --- Invoices Section --- */}
      <div>
        <SectionHeader
          title="Invoices"
          buttonText="+ New Invoice"
          onButtonClick={() => setIsAddInvoiceModalOpen(true)}
        />
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-50">
              <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {['Number', 'Status', 'Issue Date', 'Due Date', 'Total', 'Paid', 'Actions'].map((col) => (
                  <th key={col} className="px-5 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold whitespace-no-wrap">{invoice.invoice_number}</p></td>
                    <td className="px-5 py-4 text-sm"><StatusBadge status={invoice.status} /></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(invoice.issue_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(invoice.due_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{formatCurrency(invoice.total_amount, invoice.currency)}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-green-600 whitespace-no-wrap">{formatCurrency(invoice.amount_paid, invoice.currency)}</p></td>
                    <td className="px-5 py-4 text-sm flex items-center space-x-3">
                      <button className="text-indigo-600 hover:text-indigo-900 font-medium">View</button>
                      <button onClick={() => handleLogPayment(invoice)} className="text-indigo-600 hover:text-indigo-900 font-medium">Log Payment</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center py-10 text-gray-500">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Payments Section --- */}
      <div>
        <SectionHeader title="Payments" />
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-50">
              <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {['Date', 'Amount', 'Method', 'Reference Invoice', 'Actions'].map((col) => (
                  <th key={col} className="px-5 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(payment.payment_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{formatCurrency(payment.amount, payment.currency)}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{payment.payment_method}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{payment.invoices?.invoice_number || 'N/A'}</p></td>
                    <td className="px-5 py-4 text-sm"><button className="text-indigo-600 hover:text-indigo-900 font-medium">View Details</button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">No payments logged.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modals --- */}
      <AddInvoiceModal isOpen={isAddInvoiceModalOpen} onClose={() => setIsAddInvoiceModalOpen(false)} onInvoiceAdded={fetchFinancials} clientData={clientData} />
      <LogPaymentModal 
        isOpen={isLogPaymentModalOpen}
        onClose={() => setIsLogPaymentModalOpen(false)}
        onPaymentLogged={fetchFinancials}
        invoice={selectedInvoice}
      />
    </div>
  );
}

export default ClientFinancials;
