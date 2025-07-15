// FILE: src/pages/SettingsTaxesPage.jsx
// This page will now render both the Tax Rates and Tax Groups sections.

import React from 'react';
import TaxManagement from '../components/settings/TaxManagement';
import TaxGroupManagement from '../components/settings/TaxGroupManagement';

function SettingsTaxesPage() {
  return (
    <div className="space-y-12">
      <TaxManagement />
      <TaxGroupManagement />
    </div>
  );
}

export default SettingsTaxesPage;