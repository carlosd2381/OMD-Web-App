import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import AddInvoiceModal from '../../components/AddInvoiceModal';
import LogPaymentModal from '../../components/LogPaymentModal';
import AddExpenseModal from '../../components/AddExpenseModal';
import EditExpenseModal from '../../components/EditExpenseModal';
import AddCommissionModal from '../../components/AddCommissionModal';
import EditCommissionModal from '../../components/EditCommissionModal';
import AddPayrollModal from '../../components/AddPayrollModal';
import EditPayrollModal from '../../components/EditPayrollModal';
import AddFiscalInvoiceModal from '../../components/AddFiscalInvoiceModal';
import EditFiscalInvoiceModal from '../../components/EditFiscalInvoiceModal';

// Renamed from FinancialsSection to Section for clarity and to fix the error.
const Section = ({ title, buttonText, onButtonClick, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
    <div className="flex justify-between items-center mb-4 border-b pb-2">
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      {buttonText && (
        <button onClick={onButtonClick} className="bg-slate-700 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-slate-600">
          {buttonText}
        </button>
      )}
    </div>
    {children}
  </div>
);

const InfoField = ({ label, value }) => (
    <div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value || 'N/A'}</p></div>
);

const PayrollRow = ({ jobTitle, payrollEntry, teamMembers, onSave, onDelete }) => {
    const [entry, setEntry] = useState(payrollEntry || {});
    useEffect(() => { setEntry(payrollEntry || {}); }, [payrollEntry]);
    const handleChange = (e) => { const { name, value } = e.target; setEntry(prev => ({...prev, [name]: value})); };
    const handleSave = () => { onSave(jobTitle, entry); };
    const handleDelete = () => { if (entry.id) { onDelete(entry.id); } else { setEntry({}); } };
    return (
        <tr className="border-b"><td className="p-2 font-semibold">{jobTitle}</td><td className="p-1"><select name="employee_name" value={entry.employee_name || ''} onChange={handleChange} className="w-full p-1 border rounded-md text-sm"><option value="">Select Employee</option>{teamMembers.map(member => <option key={member.id} value={member.full_name}>{member.full_name}</option>)}</select></td><td className="p-1"><select name="payment_method" value={entry.payment_method || ''} onChange={handleChange} className="w-full p-1 border rounded-md text-sm"><option value="">N/A</option><option>Bank Transfer</option><option>Cash</option></select></td><td className="p-1"><input type="text" name="account_paid_from" value={entry.account_paid_from || ''} onChange={handleChange} className="w-full p-1 border rounded-md text-sm" /></td><td className="p-1"><input type="text" name="to_account" value={entry.to_account || ''} onChange={handleChange} className="w-full p-1 border rounded-md text-sm" /></td><td className="p-1"><input type="number" name="amount" value={entry.amount || ''} onChange={handleChange} className="w-full p-1 border rounded-md text-sm" required /></td><td className="p-1"><input type="date" name="paid_date" value={entry.paid_date || ''} onChange={handleChange} className="w-full p-1 border rounded-md text-sm" /></td><td className="p-1 text-center space-x-2"><button onClick={handleSave} className="text-blue-600 text-sm">Save</button><button onClick={handleDelete} className="text-red-600 text-sm">Delete</button></td></tr>
    );
};

function ClientEventFinancials() {
  const { clientData } = useOutletContext();
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isAddCommissionModalOpen, setIsAddCommissionModalOpen] = useState(false);
  const [isEditCommissionModalOpen, setIsEditCommissionModalOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [isAddPayrollModalOpen, setIsAddPayrollModalOpen] = useState(false);
  const [isEditPayrollModalOpen, setIsEditPayrollModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [isAddFiscalInvoiceModalOpen, setIsAddFiscalInvoiceModalOpen] = useState(false);
  const [isEditFiscalInvoiceModalOpen, setIsEditFiscalInvoiceModalOpen] = useState(false);
  const [editingFiscalInvoice, setEditingFiscalInvoice] = useState(null);

  const primaryEvent = clientData?.events?.[0];

  const fetchFinancials = useCallback(async () => {
    if (!primaryEvent?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('events').select(`*, contacts!inner(*, partners!left(*)), quotes!left(*, quote_items!left(*, menu_items!left(*))), event_expenses!left(*), commissions!left(*), event_payroll!left(*), fiscal_invoices!left(*)`).eq('id', primaryEvent.id).single();
      if (error) throw error;
      setFinancials(data);
      const { data: members, error: membersError } = await supabase.from('profiles').select('id, full_name');
      if(membersError) throw membersError;
      setTeamMembers(members);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [primaryEvent]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  const handleEditExpense = (expense) => { setEditingExpense(expense); setIsEditExpenseModalOpen(true); };
  const handleDeleteExpense = async (expenseId) => { if (window.confirm('Are you sure?')) { try { await supabase.from('event_expenses').delete().eq('id', expenseId); fetchFinancials(); } catch (e) { setError(e.message); } } };
  const handleEditCommission = (commission) => { setEditingCommission(commission); setIsEditCommissionModalOpen(true); };
  const handleDeleteCommission = async (commissionId) => { if (window.confirm('Are you sure?')) { try { await supabase.from('commissions').delete().eq('id', commissionId); fetchFinancials(); } catch (e) { setError(e.message); } } };
  const handleSavePayroll = async (jobTitle, entryData) => { try { const payload = { ...entryData, event_id: primaryEvent.id, job_title: jobTitle }; if (payload.id) { const { id, ...updateData } = payload; await supabase.from('event_payroll').update(updateData).eq('id', id); } else { await supabase.from('event_payroll').insert(payload); } fetchFinancials(); } catch (error) { setError(`Error saving payroll: ${error.message}`); } };
  const handleDeletePayroll = async (payrollId) => { if (window.confirm('Are you sure?')) { try { await supabase.from('event_payroll').delete().eq('id', payrollId); fetchFinancials(); } catch (error) { setError(`Error deleting payroll: ${error.message}`); } } };
  const handleEditFiscalInvoice = (invoice) => { setEditingFiscalInvoice(invoice); setIsEditFiscalInvoiceModalOpen(true); };
  const handleDeleteFiscalInvoice = async (invoiceId) => { if (window.confirm('Are you sure?')) { try { await supabase.from('fiscal_invoices').delete().eq('id', invoiceId); fetchFinancials(); } catch (e) { setError(e.message); } } };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!financials) return <div>No financial data found.</div>;
  
  const invoiceTotal = financials.quotes?.total_amount || 0;
  const totalCOG = financials.quotes?.quote_items.reduce((acc, item) => acc + (item.menu_items.item_cost * item.quantity), 0) || 0;
  const totalExpenses = financials.event_expenses.reduce((acc, exp) => acc + exp.amount, 0) || 0;
  const totalCommissions = financials.commissions.reduce((acc, com) => acc + com.amount, 0) || 0;
  const totalPayroll = financials.event_payroll.reduce((acc, pay) => acc + pay.amount, 0) || 0;
  const totalCosts = totalCOG + totalExpenses + totalCommissions + totalPayroll;
  const profit = invoiceTotal - totalCosts;

  const jobTitles = [ 'Sales & Logistics (7% Gross)', 'Churro Dough', 'Box Prep', 'Driver A', 'Driver B', 'Operating 1', 'Operating 2', 'Operating 3', 'Operating 4', 'Operating 5', 'Operating 6', 'Cleaning', 'Rolls Mix', 'Pancake Mix', 'Waffle Mix' ];

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          <Section title="Event Details"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><InfoField label="Event Date" value={financials.event_date ? new Date(financials.event_date).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'N/A'} /><InfoField label="Start Time" value={financials.start_time} /><InfoField label="End Time" value={financials.end_time} /><InfoField label="Est. Guests" value={financials.guest_count} /></div></Section>
          <Section title="Invoice Details"><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Item</th><th className="p-2 text-center">QTY</th><th className="p-2 text-right">Inv. Amount (USD)</th><th className="p-2 text-right">COG (MXN)</th></tr></thead><tbody>{financials.quotes?.quote_items.map(item => (<tr key={item.id} className="border-b"><td className="p-2">{item.menu_items.name}</td><td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.total_price)}</td><td className="p-2 text-right">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.menu_items.item_cost * item.quantity)}</td></tr>))}</tbody></table></Section>
          <Section title="Expenses" buttonText="+ Add Expense" onButtonClick={() => setIsAddExpenseModalOpen(true)}><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Description</th><th className="p-2 text-right">Amount</th><th className="p-2 text-center">Actions</th></tr></thead><tbody>{financials.event_expenses.map(expense => (<tr key={expense.id} className="border-b"><td className="p-2">{new Date(expense.expense_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td><td className="p-2">{expense.description}</td><td className="p-2 text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(expense.amount)}</td><td className="p-2 text-center space-x-2"><button onClick={() => handleEditExpense(expense)} className="text-yellow-600">Edit</button><button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600">Delete</button></td></tr>))}{financials.event_expenses.length === 0 && (<tr><td colSpan="4" className="text-center py-4 text-gray-500">No expenses logged.</td></tr>)}</tbody></table></Section>
          <Section title="Commissions" buttonText="+ Add Commission" onButtonClick={() => setIsAddCommissionModalOpen(true)}><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Type</th><th className="p-2 text-left">Paid To</th><th className="p-2 text-right">Amount</th><th className="p-2 text-center">Actions</th></tr></thead><tbody>{financials.commissions.map(commission => (<tr key={commission.id} className="border-b"><td className="p-2">{commission.commission_type}</td><td className="p-2">{commission.to_account}</td><td className="p-2 text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: commission.currency }).format(commission.amount)}</td><td className="p-2 text-center space-x-2"><button onClick={() => handleEditCommission(commission)} className="text-yellow-600">Edit</button><button onClick={() => handleDeleteCommission(commission.id)} className="text-red-600">Delete</button></td></tr>))}{financials.commissions.length === 0 && (<tr><td colSpan="4" className="text-center py-4 text-gray-500">No commissions logged.</td></tr>)}</tbody></table></Section>
          <Section title="Labour Costs"><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Job</th><th className="p-2 text-left">Employee</th><th className="p-2 text-left">Payment Method</th><th className="p-2 text-left">Account Paid From</th><th className="p-2 text-left">To Account</th><th className="p-2 text-right">Amount</th><th className="p-2 text-left">Paid Date</th><th className="p-2"></th></tr></thead><tbody>{jobTitles.map(job => (<PayrollRow key={job} jobTitle={job} payrollEntry={financials.event_payroll.find(p => p.job_title === job)} teamMembers={teamMembers} onSave={handleSavePayroll} onDelete={handleDeletePayroll} />))}</tbody></table></Section>
          <Section title="Fiscal Invoice Details" buttonText="+ Add Fiscal Invoice" onButtonClick={() => setIsAddFiscalInvoiceModalOpen(true)}><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Folio</th><th className="p-2 text-right">Total</th><th className="p-2 text-center">Actions</th></tr></thead><tbody>{financials.fiscal_invoices.map(invoice => (<tr key={invoice.id} className="border-b"><td className="p-2">{invoice.folio}</td><td className="p-2 text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.total)}</td><td className="p-2 text-center space-x-2"><button onClick={() => handleEditFiscalInvoice(invoice)} className="text-yellow-600">Edit</button><button onClick={() => handleDeleteFiscalInvoice(invoice.id)} className="text-red-600">Delete</button></td></tr>))}{financials.fiscal_invoices.length === 0 && (<tr><td colSpan="3" className="text-center py-4 text-gray-500">No fiscal invoices logged.</td></tr>)}</tbody></table></Section>
        </div>
        <aside className="w-full lg:w-80 flex-shrink-0"><div className="bg-white p-6 rounded-lg shadow-lg sticky top-8"><h3 className="text-xl font-bold text-gray-800 mb-4">Financial Summary</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Invoice Total:</span> <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoiceTotal)}</span></div><div className="flex justify-between text-red-600"><span>Total COG:</span> <span>({new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalCOG)})</span></div><div className="flex justify-between text-red-600"><span>Total Expenses:</span> <span>({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalExpenses)})</span></div><div className="flex justify-between text-red-600"><span>Total Commissions:</span> <span>({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCommissions)})</span></div><div className="flex justify-between text-red-600"><span>Total Payroll:</span> <span>({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPayroll)})</span></div><div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Gross Profit:</span> <span className={profit > 0 ? 'text-green-600' : 'text-red-600'}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(profit)}</span></div></div></div></aside>
      </div>
      <AddExpenseModal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} onExpenseAdded={fetchFinancials} eventId={primaryEvent?.id} />
      <EditExpenseModal isOpen={isEditExpenseModalOpen} onClose={() => setIsEditExpenseModalOpen(false)} onExpenseUpdated={fetchFinancials} editingExpense={editingExpense} />
      <AddCommissionModal isOpen={isAddCommissionModalOpen} onClose={() => setIsAddCommissionModalOpen(false)} onCommissionAdded={fetchFinancials} eventId={primaryEvent?.id} />
      <EditCommissionModal isOpen={isEditCommissionModalOpen} onClose={() => setIsEditCommissionModalOpen(false)} onCommissionUpdated={fetchFinancials} editingCommission={editingCommission} />
      <AddPayrollModal isOpen={isAddPayrollModalOpen} onClose={() => setIsAddPayrollModalOpen(false)} onPayrollAdded={fetchFinancials} eventId={primaryEvent?.id} />
      <EditPayrollModal isOpen={isEditPayrollModalOpen} onClose={() => setIsEditPayrollModalOpen(false)} onPayrollUpdated={fetchFinancials} editingPayroll={editingPayroll} />
      <AddFiscalInvoiceModal isOpen={isAddFiscalInvoiceModalOpen} onClose={() => setIsAddFiscalInvoiceModalOpen(false)} onFiscalInvoiceAdded={fetchFinancials} eventId={primaryEvent?.id} />
      <EditFiscalInvoiceModal isOpen={isEditFiscalInvoiceModalOpen} onClose={() => setIsEditFiscalInvoiceModalOpen(false)} onFiscalInvoiceUpdated={fetchFinancials} editingFiscalInvoice={editingFiscalInvoice} />
    </>
  );
}

export default ClientEventFinancials;
