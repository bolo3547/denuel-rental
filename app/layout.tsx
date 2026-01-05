import '../styles/globals.css';
import React from 'react';
import NotificationsToast from '../components/NotificationsToast';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import { SettingsProvider } from '../lib/SettingsContext';

export const metadata = {
  title: 'DENUEL - Find Your Dream Home in Zambia',
  description: 'Zambia\'s trusted platform for rentals, home buying, transport services, and more. Find verified properties and connect with landlords.',
  keywords: 'Zambia rentals, Lusaka apartments, house for rent, property listings, Zambia real estate',
  openGraph: {
    title: 'DENUEL - Find Your Dream Home in Zambia',
    description: 'Zambia\'s trusted platform for rentals and home buying',
    type: 'website',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased text-gray-900 bg-white">
        <SettingsProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <NotificationsToast />
            <BackToTop />
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}