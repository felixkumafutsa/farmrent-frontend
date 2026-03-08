'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'FARMER' | 'VENDOR';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/auth/login');
  };

  const getRoleBasedNav = () => {
    if (!user) return [];

    switch (user.role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Users', href: '/dashboard/users' },
          { name: 'Equipment', href: '/dashboard/equipment' },
          { name: 'Categories', href: '/dashboard/admin/categories' },
          { name: 'Analytics', href: '/dashboard/analytics' },
          { name: 'Settings', href: '/dashboard/settings' },
        ];
      case 'FARMER':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Browse Equipment', href: '/dashboard/equipment' },
          { name: 'My Bookings', href: '/dashboard/bookings' },
          { name: 'Messages', href: '/dashboard/messages' },
          { name: 'Profile', href: '/dashboard/profile' },
        ];
      case 'VENDOR':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'My Equipment', href: '/dashboard/equipment' },
          { name: 'Bookings', href: '/dashboard/bookings' },
          { name: 'Earnings', href: '/dashboard/earnings' },
          { name: 'Reviews', href: '/dashboard/reviews' },
          { name: 'Profile', href: '/dashboard/profile' },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  const navigation = getRoleBasedNav();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-green-600">FarmRent</span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex ml-10 space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === item.href
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:text-green-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                <span className="hidden md:block text-gray-700 font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-gray-500">
                  {user.role.charAt(0)}{user.role.slice(1).toLowerCase()}
                </span>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdown(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdown(false)}
                    >
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
