'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useSettings } from '@/lib/SettingsContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setIsLoggedIn(true);
          setUser(data.user);
        }
      }
    } catch (error) {
      // Not logged in
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header 
      className="w-full backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50"
      style={{ backgroundColor: settings.headerBgColor || '#ffffff' }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg sm:text-xl hover:opacity-80 transition-opacity flex items-center gap-2">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.siteName} className="h-6 sm:h-8" />
          ) : (
            <span className="text-lg sm:text-xl" style={{ color: settings.primaryColor }}>{settings.siteName}</span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-2 items-center text-sm">
          {user?.role !== 'ADMIN' && (
            <>
              <Link href="/rent" className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50" style={{ '--hover-color': settings.primaryColor } as React.CSSProperties}>
                Rent
              </Link>
              <Link href="/buy" className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50">
                Buy
              </Link>
              <Link href="/agents" className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50">
                Agents
              </Link>
              <Link href="/transport" className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50">
                Transport
              </Link>

              {/* Services Dropdown */}
              <div className="relative">
                <button
                  onMouseEnter={() => setIsServicesOpen(true)}
                  onMouseLeave={() => setIsServicesOpen(false)}
                  className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50 flex items-center gap-1 text-sm"
                >
                  Services
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isServicesOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                    onMouseEnter={() => setIsServicesOpen(true)}
                    onMouseLeave={() => setIsServicesOpen(false)}
                  >
                    <Link href="/services" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                      🔧 Home Services
                    </Link>
                    <Link href="/business-tools/budget-calculator" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                      🧮 Budget Calculator
                    </Link>
                    <Link href="/rent-payment" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                      💳 Pay Rent
                    </Link>
                    <Link href="/renters-insurance" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                      🛡️ Renters Insurance
                    </Link>
                    <Link href="/driver/apply" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                      🚗 Become a Driver
                    </Link>
                  </div>
                )}
              </div>

              {/* More Dropdown */}
              <div className="relative">
                <button
                  onMouseEnter={() => setIsMoreOpen(true)}
                  onMouseLeave={() => setIsMoreOpen(false)}
                  className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50 flex items-center gap-1 text-sm"
                >
                  More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMoreOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                    onMouseEnter={() => setIsMoreOpen(true)}
                    onMouseLeave={() => setIsMoreOpen(false)}
                  >
                    <Link href="/renters-guide" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">📚 Renters Guide</Link>
                    <Link href="/research" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">📊 Market Research</Link>
                    <Link href="/renter-hub" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">🏠 Renter Hub</Link>
                    <Link href="/saved-search" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">🔍 Saved Searches</Link>
                    <div className="border-t border-gray-100 mt-2"></div>
                    <Link href="/contact-support" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">💬 Contact</Link>
                    <Link href="/safety-tips" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">🛡️ Safety</Link>
                    <Link href="/pricing" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">💎 Pricing</Link>
                  </div>
                )}
              </div>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50">
              ⚙️ Admin Dashboard
            </Link>
          )}

          {/* List Property Button - Hide for Admin */}
          {user?.role !== 'ADMIN' && (
            <Link 
              href={isLoggedIn ? "/dashboard/properties/new" : "/auth/login?redirect=/dashboard/properties/new"}
              className="ml-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1.5 rounded-md font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              List Property
            </Link>
          )}

          {/* Auth Section */}
          <div className="flex items-center gap-2 ml-2">
            {isLoggedIn ? (
              <>
                {user?.role !== 'ADMIN' && (
                  <>
                    <Link href="/favorites" className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </Link>
                    <Link href="/notifications" className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50 relative">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </Link>
                  </>
                )}
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      {user?.role === 'ADMIN' ? (
                        <>
                          <Link href="/admin" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            ⚙️ Admin Dashboard
                          </Link>
                          <Link href="/admin/properties" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            🏠 Manage Properties
                          </Link>
                          <Link href="/admin/users" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            👥 Manage Users
                          </Link>
                          <Link href="/admin/testimonials" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            ⭐ Testimonials
                          </Link>
                          <Link href="/admin/support" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            💬 Support
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/dashboard" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            📊 Dashboard
                          </Link>
                          <Link href="/dashboard/properties/new" className="block px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 bg-green-50 border-l-2 border-green-600">
                            ➕ List New Property
                          </Link>
                          <Link href="/profile" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            👤 My Profile
                          </Link>
                          <Link href="/favorites" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            ❤️ Favorites
                          </Link>
                          <Link href="/inquiries" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            💬 Messages
                          </Link>
                          <Link href="/contact-support" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            📞 Contact Support
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50 text-sm">
                  Login
                </Link>
                <Link 
                  href="/auth/register" 
                  className="text-white px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity font-medium shadow-sm text-sm"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 lg:hidden">
          {isLoggedIn && (
            <Link href="/notifications" className="text-gray-600 hover:text-blue-600 p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 space-y-4">
            {/* User Info (if logged in) */}
            {isLoggedIn && (
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            )}

            {/* Main Links */}
            <div className="space-y-1">
              <Link href="/rent" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors font-medium py-3 px-3 rounded-lg">
                🏠 Rent
              </Link>
              <Link href="/buy" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors font-medium py-3 px-3 rounded-lg">
                🏡 Buy
              </Link>
              <Link href="/agents" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors font-medium py-3 px-3 rounded-lg">
                👥 Agents
              </Link>
              <Link href="/transport" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors font-medium py-3 px-3 rounded-lg">
                🚗 Transport
              </Link>
            </div>

            {/* Services Section */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-2 px-3">Services</div>
              <div className="space-y-1">
                <Link href="/services" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                  🔧 Home Services
                </Link>
                <Link href="/business-tools/budget-calculator" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                  🧮 Budget Calculator
                </Link>
                <Link href="/rent-payment" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                  💳 Pay Rent
                </Link>
                <Link href="/renters-insurance" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                  🛡️ Renters Insurance
                </Link>
              </div>
            </div>

            {/* Resources Section */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-2 px-3">Resources</div>
              <div className="space-y-1">
                <Link href="/renters-guide" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                  📚 Renters Guide
                </Link>
                <Link href="/research" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                  📊 Market Research
                </Link>
                <Link href="/renter-hub" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                  🏠 Renter Hub
                </Link>
                <Link href="/saved-search" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                  🔍 Saved Searches
                </Link>
              </div>
            </div>

            {/* User Section */}
            {isLoggedIn ? (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm font-semibold text-gray-900 mb-2 px-3">My Account</div>
                <div className="space-y-1">
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                    📊 Dashboard
                  </Link>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                    👤 My Profile
                  </Link>
                  <Link href="/favorites" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                    ❤️ Favorites
                  </Link>
                  <Link href="/inquiries" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                    💬 Messages
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors py-2 px-3 rounded-lg">
                      ⚙️ Admin Panel
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full mt-4 bg-red-50 text-red-600 py-3 px-3 rounded-lg font-medium hover:bg-red-100 transition-colors text-left"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-4 flex gap-3">
                <Link 
                  href="/auth/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}