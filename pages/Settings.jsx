import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A reusable card component for navigation links on the settings page.
 * @param {string} to - The route to navigate to.
 * @param {string} title - The title of the settings section.
 * @param {string} description - A brief description of the settings section.
 */
const SettingsCard = ({ to, title, description }) => (
  <Link 
    to={to} 
    className="block bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-indigo-500 transition-all duration-300 group"
  >
    <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600">{title}</h3>
    <p className="text-gray-600 mt-2">{description}</p>
  </Link>
);

// --- Main Settings Page Component ---

function Settings() {
  const settingsLinks = [
    {
      to: "/settings/menu",
      title: "Menu & Pricing",
      description: "Manage your services, menu items, and their prices for different client tiers."
    },
    {
      to: "/settings/taxes",
      title: "Taxes & Currency",
      description: "Define individual tax rates and group them for easy application to quotes and invoices."
    },
    {
      to: "/settings/questionnaires",
      title: "Questionnaire Templates",
      description: "Create and manage templates for client questionnaires and information gathering."
    },
    {
      to: "/settings/ingredients",
      title: "Ingredients Management",
      description: "Manage your raw ingredients, costs, and stock levels for recipe planning."
    },
    {
      to: "/settings/equipment",
      title: "Equipment Management",
      description: "Manage your physical assets like carts, freezers, and other operational equipment."
    },
    {
      to: "/settings/suppliers",
      title: "Supplier Management",
      description: "Manage your list of vendors and suppliers for purchase orders."
    },
    // Add other settings links here as needed
  ];

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-lg text-gray-600 mt-1">
            Configure and manage your application's core settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {settingsLinks.map(link => (
            <SettingsCard 
              key={link.to}
              to={link.to}
              title={link.title}
              description={link.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Settings;
