// apps/web/src/lib/templates/holiday-backgrounds.ts
// Fetches and caches themed stock photos from Pexels for each holiday.
// Pool of 5 photos per holiday, deterministic per-company assignment.

import { createClient } from 'pexels';
import { prisma } from '@/lib/db';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

export const HOLIDAY_TAGS: Record<string, string[]> = {
  // Tier 1 major holidays
  "New Year's Day": ['new year celebration', 'fireworks night', 'champagne toast', 'confetti party', 'sunrise new year'],
  "Valentine's Day": ['valentine hearts', 'romantic roses', 'love letter', 'pink roses bouquet', 'candlelight dinner'],
  'Good Friday': ['quiet reflection', 'church interior', 'spring blossoms', 'stone chapel'],
  'Easter Sunday': ['easter eggs', 'spring flowers', 'pastel colors spring', 'easter bunny', 'easter brunch'],
  'Family Day': ['family gathering', 'family outdoors', 'picnic family', 'family picnic'],
  "Mother's Day": ['mother child hug', 'mother daughter flowers', 'mother son happy'],
  "Father's Day": ['father child outdoors', 'father son fishing', 'father daughter happy'],
  'Halloween': ['halloween pumpkin', 'spooky night', 'autumn leaves', 'dark fog', 'halloween decorations'],
  'Christmas Eve': ['christmas lights warm', 'snowy cabin night', 'christmas fireplace', 'cozy winter night'],
  'Christmas Day': ['christmas tree', 'festive lights', 'gift giving', 'holiday season', 'christmas decorations'],
  'Day of Goodwill': ['christmas gifts', 'family holiday', 'warm celebration'],

  // Tier 2 commemorative
  'Human Rights Day': ['diverse hands together', 'human rights protest', 'equality unity'],
  'Freedom Day': ['south africa flag', 'freedom celebration', 'proud south african'],
  "International Women's Day": ['women empowerment', 'strong female portrait', 'diverse women together'],
  "National Women's Day": ['south african women', 'women empowerment', 'strong female portrait'],
  'World Cancer Day': ['hope ribbon', 'cancer awareness', 'supportive hands'],
  'World Mental Health Day': ['calm nature meditation', 'mental wellbeing', 'peaceful mind'],
  'World AIDS Day': ['red ribbon', 'solidarity hands', 'health awareness'],
  'Day of Reconciliation': ['handshake', 'reconciliation peace', 'south africa unity'],
  "Workers' Day": ['workers labor day', 'industrial worker', 'construction worker portrait'],
  'Youth Day': ['youth together', 'young people smiling', 'youth leadership'],
  'Mandela Day': ['volunteer community', 'community service', 'helping hands'],
  'Heritage Day': ['south africa culture', 'african heritage', 'traditional pattern'],
  'Spring Day': ['spring blossom', 'spring flowers field', 'spring sunshine'],

  // Tier 3 awareness
  'World Water Day': ['water droplets', 'lake reflection', 'river nature'],
  'World Health Day': ['healthcare stethoscope', 'wellness fitness', 'healthcare worker'],
  'World Environment Day': ['green forest', 'nature landscape', 'planting tree'],
  'World Food Day': ['fresh vegetables', 'harvest crops', 'food market'],
  'Earth Day': ['earth nature aerial', 'planet earth', 'green landscape'],

  // Cultural
  'Chinese New Year': ['chinese new year lanterns', 'red lantern festival', 'chinese dragon parade'],
  'Mid-Autumn Festival': ['mooncake festival', 'full moon night', 'chinese lanterns'],
  'Vesak': ['buddha temple', 'buddhist lanterns', 'peaceful temple'],
  'Holi': ['holi colors festival', 'color powder people', 'holi celebration'],
  'Vaisakhi': ['sikh festival', 'golden temple', 'punjabi celebration'],
  'Diwali': ['diwali lights', 'diya lamp', 'indian festival lights'],
  'Ramadan (Begins)': ['ramadan lantern', 'mosque sunset', 'crescent moon night'],
  'Eid al-Fitr': ['eid celebration', 'arabic geometric pattern', 'mosque architecture'],
  'Eid al-Adha': ['eid celebration', 'arabic geometric pattern', 'mosque architecture'],
  'Rosh Hashanah': ['rosh hashanah shofar', 'jewish new year', 'apple honey'],
  'Yom Kippur': ['synagogue interior', 'jewish prayer', 'quiet reflection'],
  'Hanukkah': ['hanukkah menorah', 'jewish festival lights', 'candle flames'],
};

const POOL_SIZE = 5;

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

interface StockImageRecord {
  url: string;
  photographer: string | null;
}

async function fetchPoolFromPexels(holidayName: string): Promise<StockImageRecord[]> {
  if (!PEXELS_API_KEY) {
    console.warn('PEXELS_API_KEY not set; skipping stock background fetch');
    return [];
  }

  const tags = HOLIDAY_TAGS[holidayName];
  if (!tags || tags.length === 0) return [];

  const client = createClient(PEXELS_API_KEY);
  const results: StockImageRecord[] = [];

  try {
    for (const tag of tags.slice(0, 2)) {
      const response: any = await client.photos.search({
        query: tag,
        per_page: 3,
        orientation: 'landscape',
        size: 'large',
      });
      if (response.photos && Array.isArray(response.photos)) {
        for (const photo of response.photos) {
          results.push({
            url: photo.src.large2x || photo.src.large || photo.src.original,
            photographer: photo.photographer || null,
          });
        }
      }
      if (results.length >= POOL_SIZE) break;
    }
  } catch (error) {
    console.error('Pexels fetch failed for', holidayName, error);
    return [];
  }

  return results.slice(0, POOL_SIZE);
}

async function ensurePool(holidayName: string): Promise<StockImageRecord[]> {
  const slug = slugify(holidayName);

  const existing = await prisma.holidayStockImage.findMany({
    where: { holidaySlug: slug },
    orderBy: { createdAt: 'asc' },
  });

  if (existing.length >= POOL_SIZE) {
    return existing.map((r) => ({ url: r.url, photographer: r.photographer }));
  }

  const fetched = await fetchPoolFromPexels(holidayName);
  if (fetched.length === 0) {
    return existing.map((r) => ({ url: r.url, photographer: r.photographer }));
  }

  for (let i = 0; i < fetched.length; i++) {
    const img = fetched[i];
    const pexelsId = `${slug}-${i}-${Date.now()}`;
    try {
      await prisma.holidayStockImage.create({
        data: {
          holidaySlug: slug,
          pexelsId,
          url: img.url,
          photographer: img.photographer,
          width: 1200,
          height: 630,
        },
      });
    } catch {
      // Ignore unique constraint races
    }
  }

  const finalPool = await prisma.holidayStockImage.findMany({
    where: { holidaySlug: slug },
    orderBy: { createdAt: 'asc' },
  });

  return finalPool.map((r) => ({ url: r.url, photographer: r.photographer }));
}

/**
 * Returns a deterministic stock background URL for a holiday and company.
 * Returns null if the pool is empty or the feature is unavailable.
 */
export async function getHolidayBackground(
  holidayName: string,
  companyId: string
): Promise<string | null> {
  if (!holidayName) return null;
  if (!HOLIDAY_TAGS[holidayName]) return null;

  try {
    const pool = await ensurePool(holidayName);
    if (pool.length === 0) return null;
    const idx = hashSeed(companyId + holidayName) % pool.length;
    return pool[idx].url;
  } catch (error) {
    console.error('getHolidayBackground failed:', error);
    return null;
  }
}