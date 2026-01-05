import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const properties = await prisma.property.findMany({ take: 100 });
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const urls = properties.map((p) => `  <url><loc>${base}/property/${p.id}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}