import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

// Core App Layout & Auth
import App from './App.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

// Main Pages
import Dashboard from './components/Dashboard.jsx';
import ContactsList from './pages/ContactsList.jsx'; 
import ClientHub from './pages/ClientHub.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import Email from './pages/Email.jsx';
import ReportsPage from './pages/ReportsPage.jsx'; 
import Settings from './pages/Settings.jsx';
import LoginPage from './pages/LoginPage.jsx'; 
import PrintableQuote from './pages/PrintableQuote.jsx';
import PurchaseOrdersListPage from './pages/PurchaseOrdersListPage.jsx';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage.jsx';

// Client Portal Pages
import ClientLoginPage from './components/ClientLoginPage.jsx';
import ClientPortalLayout from './components/ClientPortalLayout.jsx';
import ClientDashboard from './components/ClientDashboard.jsx'; 
import ClientProtectedRoute from './components/ClientProtectedRoute.jsx';
import ClientQuotesPage from './components/ClientQuotesPage.jsx';
import ClientInvoicesPage from './components/ClientInvoicesPage.jsx';
import ClientQuestionnairesPage from './components/ClientQuestionnairesPage.jsx';
import ClientQuestionnaireDetailPage from './components/ClientQuestionnaireDetailPage.jsx';
import CheckoutPage from './components/CheckoutPage.jsx';

// Settings Sub-Pages
import SettingsMenuPage from './pages/SettingsMenuPage.jsx';
import SettingsTaxesPage from './pages/SettingsTaxesPage.jsx';
import SettingsQuestionnairesPage from './pages/SettingsQuestionnairesPage.jsx';
import SettingsIngredientsPage from './pages/SettingsIngredientsPage.jsx';
import SettingsEquipmentPage from './pages/SettingsEquipmentPage.jsx';
import SettingsSuppliersPage from './pages/SettingsSuppliersPage.jsx';
import SettingsRolesPage from './pages/SettingsRolesPage.jsx';

// Report Pages
import RevenueReport from './components/RevenueReport.jsx';
import UnpaidInvoicesReport from './components/UnpaidInvoicesReport.jsx';
import SalesByCurrencyReport from './components/SalesByCurrencyReport.jsx';
import TaxReport from './components/TaxReport.jsx';
import EventPnlReport from './components/EventPnlReport.jsx';
import LeadsBySourceReport from './components/LeadsBySourceReport.jsx';
import ServicesBookedReport from './components/ServicesBookedReport.jsx';
import PipelineFunnelReport from './components/PipelineFunnelReport.jsx';
import ClientRetentionReport from './components/ClientRetentionReport.jsx';
import InventoryNeedsReport from './components/InventoryNeedsReport.jsx';
import StaffAssignmentsReport from './components/StaffAssignmentsReport.jsx';
import EquipmentUsageReport from './components/EquipmentUsageReport.jsx';
import SupplierHistoryReport from './components/SupplierHistoryReport.jsx';
import CommissionReport from './components/CommissionReport.jsx';
import VendorPerformanceReport from './components/VendorPerformanceReport.jsx';

// Client Hub Tab Components
import ClientOverview from './pages/client-hub/ClientOverview.jsx';
import ClientQuotes from './pages/client-hub/ClientQuotes.jsx';
import ClientFinancials from './pages/client-hub/ClientFinancials.jsx';
import ClientEventSheet from './pages/client-hub/ClientEventSheet.jsx';
import ClientEventFinancials from './pages/client-hub/ClientEventFinancials.jsx';
import ClientMail from './pages/client-hub/ClientMail.jsx';
import ClientContracts from './pages/client-hub/ClientContracts.jsx';
import ClientQuestionnaires from './pages/client-hub/ClientQuestionnaires.jsx';
import ClientTasks from './pages/client-hub/ClientTasks.jsx';
import ClientNotes from './pages/client-hub/ClientNotes.jsx';
import ClientFiles from './pages/client-hub/ClientFiles.jsx';

import './index.css';

const router = createBrowserRouter([
  // Admin Portal Routes
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { 
        path: "/",
        element: <App />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "client-hub", element: <ContactsList /> },
          {
            path: "client-hub/:id",
            element: <ClientHub />,
            children: [
              { index: true, element: <ClientOverview /> },
              { path: "quotes", element: <ClientQuotes /> },
              { path: "financials", element: <ClientFinancials /> },
              { path: "event-sheet", element: <ClientEventSheet /> },
              { path: "event-financials", element: <ClientEventFinancials /> },
              { path: "mail", element: <ClientMail /> },
              { path: "contracts", element: <ClientContracts /> },
              { path: "questionnaires", element: <ClientQuestionnaires /> },
              { path: "tasks", element: <ClientTasks /> },
              { path: "notes", element: <ClientNotes /> },
              { path: "files", element: <ClientFiles /> },
            ]
          },
          { path: "calendar", element: <CalendarPage /> },
          { path: "email", element: <Email /> },
          { 
            path: "purchasing", 
            element: <Outlet />,
            children: [
              { index: true, element: <PurchaseOrdersListPage /> },
              { path: "new", element: <PurchaseOrderDetailPage /> },
              { path: ":id", element: <PurchaseOrderDetailPage /> },
            ]
          },
          { 
            path: "reports", 
            element: <Outlet />,
            children: [
              { index: true, element: <ReportsPage /> },
              { path: "revenue", element: <RevenueReport /> },
              { path: "unpaid-invoices", element: <UnpaidInvoicesReport /> },
              { path: "sales-by-currency", element: <SalesByCurrencyReport /> },
              { path: "tax", element: <TaxReport /> },
              { path: "event-pnl", element: <EventPnlReport /> },
              { path: "leads-by-source", element: <LeadsBySourceReport /> },
              { path: "services-booked", element: <ServicesBookedReport /> },
              { path: "pipeline-funnel", element: <PipelineFunnelReport /> },
              { path: "client-retention", element: <ClientRetentionReport /> },
              { path: "inventory-needs", element: <InventoryNeedsReport /> },
              { path: "staff-assignments", element: <StaffAssignmentsReport /> },
              { path: "equipment-usage", element: <EquipmentUsageReport /> },
              { path: "supplier-history", element: <SupplierHistoryReport /> },
              { path: "commission-report", element: <CommissionReport /> },
              { path: "vendor-performance", element: <VendorPerformanceReport /> },
            ]
          },
          { 
            path: "settings", 
            element: <Outlet />,
            children: [
              { index: true, element: <Settings /> },
              { path: "menu", element: <SettingsMenuPage /> },
              { path: "taxes", element: <SettingsTaxesPage /> },
              { path: "questionnaires", element: <SettingsQuestionnairesPage /> },
              { path: "ingredients", element: <SettingsIngredientsPage /> },
              { path: "equipment", element: <SettingsEquipmentPage /> },
              { path: "suppliers", element: <SettingsSuppliersPage /> },
              { path: "roles", element: <SettingsRolesPage /> },
            ]
          },
        ],
      },
    ]
  },
  // Public and Client Portal Routes
  { path: "/login", element: <LoginPage /> },
  { path: "/quote/:quoteId/view", element: <PrintableQuote /> },
  { 
    path: "/portal",
    element: <ClientPortalLayout />,
    children: [
      { path: "login", element: <ClientLoginPage /> },
      { 
        element: <ClientProtectedRoute />,
        children: [
          { path: "dashboard", element: <ClientDashboard /> },
          { path: "quotes", element: <ClientQuotesPage /> },
          { path: "invoices", element: <ClientInvoicesPage /> },
          { path: "questionnaires", element: <Outlet />, children: [
            { index: true, element: <ClientQuestionnairesPage /> },
            { path: ":id", element: <ClientQuestionnaireDetailPage /> }
          ]},
          { path: "checkout/:invoiceId", element: <CheckoutPage /> },
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
