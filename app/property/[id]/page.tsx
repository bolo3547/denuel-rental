import React from 'react';
import Header from '../../../components/Header';
import prisma from '../../../lib/prisma';
import MessageForm from '../../../components/MessageForm';
import FavoriteButton from '../../../components/FavoriteButton';
import ReportListing from '../../../components/ReportListing';
import PropertyValuation from '@/components/PropertyValuation';
import NeighborhoodScores from '@/components/NeighborhoodScores';
import VirtualTourViewer from '@/components/VirtualTourViewer';
import ViewingScheduler from '@/components/ViewingScheduler';
import PriceAlertButton from '@/components/PriceAlertButton';
import OpenHouseScheduler from '@/components/OpenHouseScheduler';
import Panorama360Section from '@/components/Panorama360Section';

function formatLocation(p: any) {
  return [p?.area, p?.city].filter(Boolean).join(', ') || p?.city || '';
}

function waLink(phone: string, text: string) {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const prop = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, phone: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      virtualTour: true,
      floorPlans: true,
      valuations: { orderBy: { createdAt: 'desc' }, take: 1 },
      openHouses: { 
        where: { startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
        take: 3,
      },
      viewingSlots: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
    },
  });
  if (!prop) return <div className="p-8">Property not found</div>;

  // Fetch neighborhood data if property has coordinates
  let neighborhood = null;
  if (prop.latitude && prop.longitude) {
    neighborhood = await prisma.neighborhood.findFirst({
      where: {
        OR: [
          { name: prop.area || '' },
          { city: prop.city || '' }
        ]
      },
      include: {
        schools: { take: 5, orderBy: { rating: 'desc' } }
      }
    });
  }

  const heroImage = prop.images?.[0]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23ddd" width="800" height="600"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="48" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
  const regularImages = prop.images?.filter((img: any) => !img.is360) || [];
  const panorama360Images = prop.images?.filter((img: any) => img.is360) || [];
  const location = formatLocation(prop);
  const whatsapp = prop.owner?.phone
    ? waLink(prop.owner.phone, `Hello, I'm interested in "${prop.title}" on DENUEL. Is it still available?`)
    : null;
  
  const virtualTour = prop.virtualTour;
  const valuation = prop.valuations?.[0];

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Virtual Tour Banner */}
          {virtualTour && (
            <div className="mb-4">
              <VirtualTourViewer propertyId={prop.id} />
            </div>
          )}

          {/* 360° Panorama Views */}
          {panorama360Images.length > 0 && (
            <Panorama360Section images={panorama360Images} />
          )}
          
          <div className="rounded overflow-hidden mb-4 relative">
            <img src={heroImage} alt={prop.title} className="w-full max-h-96 object-cover" />
            {virtualTour && (
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>🎥</span> 3D Tour Available
              </div>
            )}
          </div>

          {prop.images?.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-auto">
              {prop.images.slice(0, 8).map((img) => (
                <img key={img.id} src={img.url} alt="" className="h-20 w-28 object-cover rounded border" />
              ))}
            </div>
          )}

          {/* Floor Plans */}
          {prop.floorPlans && prop.floorPlans.length > 0 && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded p-4 shadow">
              <h3 className="font-semibold mb-3">Floor Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prop.floorPlans.map((plan) => (
                  <div key={plan.id} className="border rounded p-2">
                    <img src={plan.imageUrl} alt={plan.name || 'Floor Plan'} className="w-full h-40 object-cover rounded" />
                    <div className="mt-2 text-sm">
                      <div className="font-medium">{plan.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-2xl font-semibold mb-2">{prop.title}</h1>
          <div className="text-muted mb-4">{location}</div>
          <div className="mb-6 whitespace-pre-line">{prop.description}</div>

          <div className="bg-white dark:bg-gray-800 rounded p-4 shadow mb-6">
            <h3 className="font-semibold mb-2">Key details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>Furnished: {prop.furnished ? 'Yes' : 'No'}</div>
              <div>Parking spaces: {prop.parkingSpaces ?? 0}</div>
              <div>Pets allowed: {prop.petsAllowed ? 'Yes' : 'No'}</div>
              <div>Internet: {prop.internetAvailable ? 'Yes' : 'No'}</div>
              <div>Water: {prop.waterSource}</div>
              <div>Power backup: {prop.powerBackup}</div>
              <div>Short-stay: {prop.isShortStay ? 'Yes' : 'No'}</div>
              <div>Student-friendly: {prop.isStudentFriendly ? 'Yes' : 'No'}</div>
              {prop.virtualTourUrl && (
                <div className="md:col-span-2">
                  Virtual tour:{' '}
                  <a className="text-blue-600 underline" href={prop.virtualTourUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </div>
              )}
              {Array.isArray(prop.securityFeatures) && prop.securityFeatures.length > 0 && (
                <div className="md:col-span-2">Security: {prop.securityFeatures.join(', ')}</div>
              )}
            </div>
          </div>

          {/* Property Valuation Section */}
          {valuation && (
            <div className="mb-6">
              <PropertyValuation propertyId={prop.id} />
            </div>
          )}

          {/* Neighborhood Scores */}
          {neighborhood && (
            <div className="mb-6">
              <NeighborhoodScores neighborhoodId={neighborhood.id} />
            </div>
          )}

          {/* Open Houses */}
          {prop.openHouses && prop.openHouses.length > 0 && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded p-4 shadow">
              <h3 className="font-semibold mb-3">📅 Upcoming Open Houses</h3>
              <div className="space-y-3">
                {prop.openHouses.map((oh) => (
                  <div key={oh.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">
                        {new Date(oh.startTime).toLocaleDateString('en-US', { 
                          weekday: 'long', month: 'short', day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(oh.startTime).toLocaleTimeString('en-US', { 
                          hour: 'numeric', minute: '2-digit' 
                        })} - {new Date(oh.endTime).toLocaleTimeString('en-US', { 
                          hour: 'numeric', minute: '2-digit' 
                        })}
                      </div>
                      {oh.isVirtual && (
                        <span className="text-xs text-blue-600">Virtual option available</span>
                      )}
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                      RSVP
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded p-4 shadow">
            <div className="text-2xl font-bold mb-2">K{prop.price.toLocaleString()}</div>
            {prop.deposit ? <div className="text-sm text-muted mb-2">Deposit: K{prop.deposit.toLocaleString()}</div> : null}
            <div className="mb-2">
              {prop.bedrooms} bd • {prop.bathrooms} ba
            </div>
            <div className="mb-4">Contact: {prop.owner?.name || 'Owner'}</div>

            <div className="flex flex-col gap-2">
              <FavoriteButton propertyId={prop.id} />
              <PriceAlertButton propertyId={prop.id} currentPrice={prop.price} propertyTitle={prop.title} />
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="p-2 rounded border text-center hover:bg-gray-50 dark:hover:bg-gray-700">
                  💬 Chat on WhatsApp
                </a>
              )}
            </div>

            <div className="mt-6">
              <MessageForm receiverId={prop.ownerId} propertyId={prop.id} />
            </div>

            <ReportListing propertyId={prop.id} />
          </div>

          {/* Schedule a Tour */}
          {prop.viewingSlots && prop.viewingSlots.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded p-4 shadow">
              <h3 className="font-semibold mb-3">📅 Schedule a Tour</h3>
              <ViewingScheduler propertyId={prop.id} propertyTitle={prop.title} />
            </div>
          )}

          {/* Nearby Schools */}
          {neighborhood?.schools && neighborhood.schools.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded p-4 shadow">
              <h3 className="font-semibold mb-3">🏫 Nearby Schools</h3>
              <div className="space-y-2">
                {neighborhood.schools.slice(0, 3).map((school) => (
                  <div key={school.id} className="flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium">{school.name}</div>
                      <div className="text-gray-500">{school.type} • {school.level}</div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {school.rating}/10
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded p-4 shadow">
            <h3 className="font-semibold mb-3">🔗 Tools</h3>
            <div className="space-y-2">
              <a href="/mortgage-calculator" className="block p-2 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                💰 Mortgage Calculator
              </a>
              <a href={`/compare?ids=${prop.id}`} className="block p-2 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                📊 Compare Properties
              </a>
              <a href="/services" className="block p-2 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                🔧 Find Home Services
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
