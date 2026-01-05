"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RenterHub() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/applications')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Check if data is an array
        if (Array.isArray(data)) {
          setApplications(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Invalid response format');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications');
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Renter Hub</h1>
      <p className="mb-4">Manage your rental search and applications in one place.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/favorites" className="block p-4 bg-white rounded shadow hover:shadow-md">
          <h2 className="text-xl font-semibold">Saved Properties</h2>
          <p>View your favorite listings.</p>
        </Link>
        <Link href="/saved-searches" className="block p-4 bg-white rounded shadow hover:shadow-md">
          <h2 className="text-xl font-semibold">Saved Searches</h2>
          <p>Manage your search alerts.</p>
        </Link>
        <Link href="/notifications" className="block p-4 bg-white rounded shadow hover:shadow-md">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p>Check your messages and updates.</p>
        </Link>
        <Link href="/inquiries" className="block p-4 bg-white rounded shadow hover:shadow-md">
          <h2 className="text-xl font-semibold">My Inquiries</h2>
          <p>Track your property inquiries.</p>
        </Link>
        <Link href="/business-tools/budget-calculator" className="block p-4 bg-white rounded shadow hover:shadow-md">
          <h2 className="text-xl font-semibold">Budget Calculator</h2>
          <p>Calculate your rent budget.</p>
        </Link>
        <Link href="/renters-guide" className="block p-4 bg-white rounded shadow hover:shadow-md">
          <h2 className="text-xl font-semibold">Renters Guide</h2>
          <p>Tips and resources for renters.</p>
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-4">My Applications</h2>
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading applications...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-600 mt-2">
            Make sure you&apos;re logged in to view your applications.
          </p>
        </div>
      ) : applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">{app.property?.title || 'Property Title'}</h3>
              <p>Status: {app.status}</p>
              <p>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}