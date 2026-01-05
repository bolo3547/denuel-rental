import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ListingsGrid from '../components/ListingsGrid';
import ListingCard from '../components/ListingCard';
import MapSplitView from '../components/MapSplitView';
import RetryButton from '../components/RetryButton';
import prisma from '../lib/prisma';

export const metadata: Metadata = {
  title: 'DENUEL | Find Rentals, Homes, and Apartments',
  description: 'Search verified rentals, view 360° tours, and connect with trusted landlords across Zambia.',
  openGraph: {
    title: 'DENUEL | Find Rentals, Homes, and Apartments',
    description: 'Search verified rentals, view 360° tours, and connect with trusted landlords across Zambia.',
    url: 'https://denuel.com/',
    siteName: 'DENUEL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DENUEL | Find Rentals, Homes, and Apartments',
    description: 'Search verified rentals, view 360° tours, and connect with trusted landlords across Zambia.',
  },
};

export default async function Home() {
  // Fetch properties with error handling
  let rentalProps: any[] = [];
  let saleProps: any[] = [];
  let totalRentals = 0;
  let totalSales = 0;
  let error = null;
  let stats = {
    totalProperties: 0,
    totalUsers: 0,
    totalLandlords: 0,
    avgRating: 4.8
  };

  try {
    [rentalProps, saleProps, totalRentals, totalSales, stats.totalProperties, stats.totalUsers, stats.totalLandlords] = await Promise.all([
      // Fetch rental properties
      prisma.property.findMany({
        where: { 
          status: 'APPROVED',
          listingType: { in: ['RENT', 'BOTH'] }
        },
        include: { 
          images: { orderBy: { sortOrder: 'asc' } },
          owner: { select: { id: true, name: true, phone: true } }
        },
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      // Fetch sale properties
      prisma.property.findMany({
        where: { 
          status: 'APPROVED',
          listingType: { in: ['SALE', 'BOTH'] }
        },
        include: { 
          images: { orderBy: { sortOrder: 'asc' } },
          owner: { select: { id: true, name: true, phone: true } }
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.property.count({ where: { status: 'APPROVED', listingType: { in: ['RENT', 'BOTH'] } } }),
      prisma.property.count({ where: { status: 'APPROVED', listingType: { in: ['SALE', 'BOTH'] } } }),
      prisma.property.count({ where: { status: 'APPROVED' } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ['LANDLORD', 'AGENT'] } } })
    ]);
  } catch (e) {
    console.error('Failed to fetch properties:', e);
    error = 'Unable to load properties at this time.';
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Zillow Style */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your
              <span className="block text-blue-600">Dream Home</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Search millions of rentals, get the best deals, and find your perfect place with our trusted platform.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified Listings</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Background Checked</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="max-w-5xl mx-auto">
            <SearchBar />
          </div>

          {/* CTA Buttons Below Search */}
          <div className="max-w-3xl mx-auto mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/rent"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Rentals
            </Link>
            <Link
              href="/dashboard/properties/new"
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              List Your Property
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalProperties.toLocaleString()}+</div>
                <div className="text-sm text-gray-600">Active Rentals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers.toLocaleString()}+</div>
                <div className="text-sm text-gray-600">Happy Tenants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalLandlords}+</div>
                <div className="text-sm text-gray-600">Verified Landlords</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.avgRating}★</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Searches */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Searches</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                '1 Bedroom Apartments',
                'Pet Friendly Homes',
                'Luxury Rentals',
                'Studio Apartments',
                '2 Bedroom Houses',
                'Furnished Rentals',
                'Downtown Condos',
                'Suburban Homes'
              ].map((search) => (
                <Link
                  key={search}
                  href={`/rent?query=${encodeURIComponent(search)}`}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></div>
                    <span className="text-gray-700 group-hover:text-blue-600 transition-colors">{search}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rentals */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Rentals</h2>
                <p className="text-gray-600">
                  {totalRentals > 0 ? `${totalRentals} rental properties available` : 'Handpicked rentals with the best value and quality'}
                </p>
              </div>
              <Link
                href="/rent"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
              >
                View all rentals
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Unable to Load Properties</h3>
                    <p className="text-red-700 text-sm mb-4">{error}</p>
                    <RetryButton />
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!error && rentalProps.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-2xl">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Rental Properties Available Yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We're working hard to bring you the best rental properties. Check back soon or sign up to be notified when new listings are added.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Get Notified
                  </Link>
                  <Link
                    href="/auth/register"
                    className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all font-medium"
                  >
                    List Your Property
                  </Link>
                </div>
              </div>
            )}

            {/* Properties Grid */}
            {!error && rentalProps.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {rentalProps.map((property) => (
                    <ListingCard key={property.id} property={property} listingType="RENT" />
                  ))}
                </div>
                
                {/* Show more CTA */}
                {totalRentals > 8 && (
                  <div className="text-center">
                    <div className="inline-flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                      <p className="text-gray-700">
                        Showing <span className="font-semibold text-gray-900">8</span> of <span className="font-semibold text-gray-900">{totalRentals}</span> rental properties
                      </p>
                      <Link
                        href="/rent"
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        View All {totalRentals} Rentals
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Properties For Sale */}
      {saleProps.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Properties For Sale</h2>
                  <p className="text-gray-600">
                    {totalSales > 0 ? `${totalSales} properties available for purchase` : 'Invest in your future home'}
                  </p>
                </div>
                <Link
                  href="/buy"
                  className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
                >
                  View all for sale
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {saleProps.map((property) => (
                  <ListingCard key={property.id} property={property} listingType="SALE" />
                ))}
              </div>

              {/* Show more CTA for sales */}
              {totalSales > 4 && (
                <div className="mt-8 text-center">
                  <div className="inline-flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl">
                    <p className="text-gray-700">
                      Showing <span className="font-semibold text-gray-900">4</span> of <span className="font-semibold text-gray-900">{totalSales}</span> properties for sale
                    </p>
                    <Link
                      href="/buy"
                      className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      View All {totalSales} Properties
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us - Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Renters Choose DENUEL</h2>
              <p className="text-xl text-gray-600">Join thousands of satisfied renters who found their perfect home</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified & Safe</h3>
                <p className="text-gray-600">All properties are personally verified. Background checks on all landlords.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Best Price Guarantee</h3>
                <p className="text-gray-600">Find the best deals with our price matching and rental market insights.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
                <p className="text-gray-600">Our expert team is always here to help with any questions or concerns.</p>
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">What Our Renters Say</h3>
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-gray-600 font-medium">4.8 out of 5 stars</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-semibold">SM</span>
                  </div>
                  <p className="text-gray-600 mb-2">&quot;Found my dream apartment in just 2 days. The verification process gave me peace of mind.&quot;</p>
                  <div className="text-sm text-gray-500">- Sarah M., New York</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-semibold">JD</span>
                  </div>
                  <p className="text-gray-600 mb-2">&quot;The landlord was responsive and the property was exactly as described. Highly recommend!&quot;</p>
                  <div className="text-sm text-gray-500">- John D., California</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 font-semibold">AK</span>
                  </div>
                  <p className="text-gray-600 mb-2">&quot;Saved thousands compared to other platforms. The market insights were incredibly helpful.&quot;</p>
                  <div className="text-sm text-gray-500">- Anna K., Texas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Perfect Home?</h2>
            <p className="text-xl text-blue-100 mb-8">Join thousands of renters who trust DENUEL for their housing needs.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/rent" className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Start Your Search
              </a>
              <a href="/auth/register" className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-300 font-semibold text-lg">
                List Your Property
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
