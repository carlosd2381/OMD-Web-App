import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, Mail, BarChart2, Settings } from 'lucide-react'; // Example icons

const NavItem = ({ to, icon, children }) => (
  <NavLink
    to={to}
    end // Use 'end' to prevent parent routes from staying active
    className={({ isActive }) =>
      `flex items-center px-4 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors duration-200 ${
        isActive ? 'bg-gray-200 font-bold' : ''
      }`
    }
  >
    {icon}
    <span className="ml-3">{children}</span>
  </NavLink>
);

function Sidebar() {
  // You can get user info from your AuthContext
  const user = { name: 'Carlos Denaro', role: 'Administrator' };

  return (
    <aside className="w-64 bg-white flex-shrink-0 p-4 border-r border-gray-200 flex flex-col">
      <div className="text-2xl font-bold text-gray-800 mb-8">
        Oh My Desserts!
      </div>
      <nav className="flex-grow">
        <ul className="space-y-2">
          <li><NavItem to="/" icon={<Home size={20} />}>Dashboard</NavItem></li>
          <li><NavItem to="/client-hub" icon={<Users size={20} />}>Client Hub</NavItem></li>
          <li><NavItem to="/calendar" icon={<Calendar size={20} />}>Calendar</NavItem></li>
          <li><NavItem to="/email" icon={<Mail size={20} />}>Email</NavItem></li>
          <li><NavItem to="/purchasing" icon={<BarChart2 size={20} />}>Purchasing</NavItem></li>
          <li><NavItem to="/reports" icon={<BarChart2 size={20} />}>Reports</NavItem></li>
          <li><NavItem to="/settings" icon={<Settings size={20} />}>Settings</NavItem></li>
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="font-bold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-600">{user.role}</p>
          <button className="w-full mt-4 text-left text-sm text-red-600 hover:font-semibold">
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
