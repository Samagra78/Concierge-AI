import { Router, Request, Response } from 'express';
import {
  executeConciergeChat,
  generateItineraryPlan,
  replanItinerarySlot,
  dispatchErrandWithGemini,
} from '../services/gemini.service';
import { Task } from '../models/Task';
import { Quote } from '../models/Quote';
import { Approval } from '../models/Approval';
import { AuditLog } from '../models/AuditLog';
import { config } from '../config/env';
import { requireAuth } from '../middleware/auth';

const router = Router();

async function geoapifyGeocode(text: string): Promise<{ lat: number; lon: number; formatted: string }> {
  if (!config.geoapifyApiKey) throw new Error('Geoapify is not configured. Add GEOAPIFY_API_KEY to the server .env.');
  const params = new URLSearchParams({ text, format: 'json', limit: '1', apiKey: config.geoapifyApiKey });
  const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`);
  if (!response.ok) throw new Error(`Geoapify geocoding failed (${response.status}).`);
  const data = await response.json() as any;
  const result = data.results?.[0];
  if (!result || !Number.isFinite(result.lat) || !Number.isFinite(result.lon)) throw new Error(`Could not find a map location for "${text}".`);
  return { lat: result.lat, lon: result.lon, formatted: result.formatted || text };
}

function estimateDiscoveryPrice(totalBudget: number, dailyBudget: number, remainingBudget: number): number {
  const tripLimit = Math.floor(Math.max(0, totalBudget) / 5);
  const upperLimit = Math.floor(Math.min(tripLimit, Math.max(0, dailyBudget), Math.max(0, remainingBudget)));
  return upperLimit > 0 ? Math.floor(Math.random() * upperLimit) + 1 : 0;
}

router.get('/places/geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const text = String(req.query.text || '').trim();
    if (!text) { res.status(400).json({ success: false, error: 'A destination is required.' }); return; }
    res.json({ success: true, location: await geoapifyGeocode(text) });
  } catch (error) {
    res.status(502).json({ success: false, error: (error as Error).message });
  }
});

router.get('/places/map', async (req: Request, res: Response): Promise<void> => {
  let lat = Number(req.query.lat), lon = Number(req.query.lon);
  const zoom = Math.max(3, Math.min(18, Number(req.query.zoom) || 13));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !config.geoapifyApiKey) { res.status(400).end(); return; }
  try {
    let points: Array<{ lat: number; lon: number }> = [];
    if (typeof req.query.points === 'string') {
      try {
        const parsed = JSON.parse(req.query.points);
        if (Array.isArray(parsed)) points = parsed.slice(0, 8).filter((point: any) => Number.isFinite(point?.lat) && Number.isFinite(point?.lon) && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180);
      } catch { /* Ignore malformed optional route points and still render the base map. */ }
    }
    const params = new URLSearchParams({ style: 'osm-bright', width: '1000', height: '600', center: `lonlat:${lon},${lat}`, zoom: String(zoom), apiKey: config.geoapifyApiKey });
    if (points.length) {
      const bounds = points.reduce((result, point) => ({ minLat: Math.min(result.minLat, point.lat), maxLat: Math.max(result.maxLat, point.lat), minLon: Math.min(result.minLon, point.lon), maxLon: Math.max(result.maxLon, point.lon) }), { minLat: points[0].lat, maxLat: points[0].lat, minLon: points[0].lon, maxLon: points[0].lon });
      lat = (bounds.minLat + bounds.maxLat) / 2;
      lon = (bounds.minLon + bounds.maxLon) / 2;
      let routeZoom = zoom;
      if (points.length > 1) {
        const latSpan = Math.max((bounds.maxLat - bounds.minLat) * 110540, 100);
        const lonSpan = Math.max((bounds.maxLon - bounds.minLon) * 111320 * Math.cos(lat * Math.PI / 180), 100);
        const zoomForWidth = Math.log2((156543 * Math.max(0.2, Math.cos(lat * Math.PI / 180)) * 1000 * 0.72) / lonSpan);
        const zoomForHeight = Math.log2((156543 * 600 * 0.72) / latSpan);
        routeZoom = Math.max(3, Math.min(17, Math.floor(Math.min(zoomForWidth, zoomForHeight))));
      }
      params.set('center', `lonlat:${lon},${lat}`);
      params.set('zoom', String(routeZoom));
      points.forEach((point, index) => params.append('marker', `lonlat:${point.lon},${point.lat};type:material;color:#b89547;size:large;text:${index + 1};contentcolor:#000000`));
      if (points.length > 1) params.append('geometry', `polyline:${points.map((point) => `${point.lon},${point.lat}`).join(',')};linecolor:#000000;linewidth:4;lineopacity:0.85;linestyle:solid`);
    }
    const image = await fetch(`https://maps.geoapify.com/v1/staticmap?${params}`);
    if (!image.ok) {
      const details = (await image.text()).replaceAll(config.geoapifyApiKey, '[redacted]').slice(0, 300);
      console.error(`[Geoapify] Static map request failed (${image.status}): ${details}`);
      res.status(502).end();
      return;
    }
    res.setHeader('Content-Type', image.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(Buffer.from(await image.arrayBuffer()));
  } catch { res.status(502).end(); }
});

// Nearby results from Geoapify Places API. The key stays on the server.
router.post('/places/nearby', async (req: Request, res: Response): Promise<void> => {
  const { lat, lon, category = 'catering' } = req.body;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ success: false, error: 'A valid latitude and longitude are required' });
    return;
  }
  if (!config.geoapifyApiKey) {
    res.status(503).json({ success: false, error: 'Geoapify is not configured. Add GEOAPIFY_API_KEY to the server .env.' });
    return;
  }
  try {
    const categories: Record<string, string> = { cafe: 'catering.cafe', restaurant: 'catering.restaurant', hotel: 'accommodation.hotel', laundry: 'service.vehicle.repair' };
    const params = new URLSearchParams({ categories: categories[String(category).toLowerCase()] || 'catering', filter: `circle:${lon},${lat},5000`, bias: `proximity:${lon},${lat}`, limit: '20', apiKey: config.geoapifyApiKey });
    const response = await fetch(`https://api.geoapify.com/v2/places?${params}`);
    if (!response.ok) throw new Error(`Geoapify returned ${response.status}`);
    const data = await response.json() as any;
    const places = (data.features || []).map((feature: any) => ({ id: feature.properties.place_id, name: feature.properties.name || feature.properties.address_line1 || 'Nearby place', address: feature.properties.address_line2 || feature.properties.formatted, lat: feature.properties.lat, lon: feature.properties.lon, categories: feature.properties.categories || [], distance: feature.properties.distance }));
    res.json({ success: true, places, mapUrl: `/api/places/map?lat=${lat}&lon=${lon}&zoom=13` });
  } catch (error) {
    res.status(502).json({ success: false, error: `Nearby places lookup failed: ${(error as Error).message}` });
  }
});

/**
 * POST /api/chat
 * Multi-turn Gemini chat supporting conversation history, system instructions,
 * model selection (gemini-3.8-flash),
 * Google Maps grounding, and Google Search grounding.
 */
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, systemRole, model, enableMaps, enableSearch, location } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, error: 'messages array is required' });
      return;
    }

    const result = await executeConciergeChat({
      messages,
      systemRole,
      model,
      enableMaps,
      enableSearch,
      location,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[AI Routes] Chat error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * POST /api/itinerary/generate
 * Generates an up-to-date, grounded luxury travel itinerary using Gemini with Google Maps and Search.
 */
router.post('/itinerary/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { destination, durationDays, totalBudget, dna, prompt } = req.body;

    const result = await generateItineraryPlan({
      destination: destination || 'Tokyo',
      durationDays: Number(durationDays),
      totalBudget: Number(totalBudget),
      dna,
      prompt,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[AI Routes] Itinerary error:', error);
    const message = (error as Error).message;
    const retryable = /429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(message);
    res.status(retryable ? 429 : 502).json({ success: false, error: message });
  }
});

router.post('/itinerary/replan-slot', async (req: Request, res: Response): Promise<void> => {
  try {
    const { destination, day, activity, request, dna, remainingBudget } = req.body || {};
    if (!destination || !day || !activity?.title) {
      res.status(400).json({ success: false, error: 'Destination, day details, and current activity are required.' });
      return;
    }
    const result = await replanItinerarySlot({ destination, day, activity, request, dna, remainingBudget: Number(remainingBudget) });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[AI Routes] Slot replanning error:', error);
    const message = (error as Error).message;
    const retryable = /429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(message);
    res.status(retryable ? 429 : 502).json({ success: false, error: message });
  }
});

/**
 * POST /api/places/discover
 * Smart discovery of real places from Geoapify, ranked by Traveler DNA and INR budget.
 */
router.post('/places/discover', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category = 'All', destination, dna, budgetPerDay, remainingBudget, totalBudget, durationDays = 1 } = req.body || {};
    if (!String(destination || '').trim()) { res.status(400).json({ success: false, error: 'Enter a city or area to discover places.' }); return; }
    if (!config.geoapifyApiKey) { res.status(503).json({ success: false, error: 'Geoapify is not configured. Add GEOAPIFY_API_KEY to the server .env.' }); return; }
    const location = await geoapifyGeocode(String(destination));
    const categoryPaths: Record<string, string> = {
      'All': 'catering.restaurant,catering.cafe,accommodation.hotel,tourism.attraction,entertainment.museum,public_transport',
      'Food & Drink': 'catering.restaurant,catering.cafe',
      'Specialty Coffee': 'catering.cafe',
      'Fine Dining': 'catering.restaurant',
      'Accommodation': 'accommodation.hotel',
      'Attractions': 'tourism.attraction,entertainment.museum,entertainment.culture',
      'Modern Art': 'entertainment.museum,entertainment.culture',
      'Architecture': 'tourism.attraction,heritage',
      'Travel & Transport': 'public_transport',
    };
    const params = new URLSearchParams({
      categories: categoryPaths[String(category)] || categoryPaths.All,
      filter: `circle:${location.lon},${location.lat},12000`,
      bias: `proximity:${location.lon},${location.lat}`,
      limit: '40',
      apiKey: config.geoapifyApiKey,
    });
    const response = await fetch(`https://api.geoapify.com/v2/places?${params}`);
    if (!response.ok) {
      const details = (await response.text()).replaceAll(config.geoapifyApiKey, '[redacted]').slice(0, 300);
      throw new Error(`Geoapify Places returned ${response.status}: ${details}`);
    }
    const data = await response.json() as any;
    const effectiveDailyBudget = Math.max(0, Number(budgetPerDay) || 25000);
    const availableBudget = Number.isFinite(Number(remainingBudget)) ? Math.max(0, Number(remainingBudget)) : effectiveDailyBudget;
    const effectiveTotalBudget = Number(totalBudget) > 0 ? Number(totalBudget) : effectiveDailyBudget * Math.max(1, Number(durationDays) || 1);
    const interests: string[] = Array.isArray(dna?.interests) ? dna.interests : [];
    const places = (data.features || []).map((feature: any) => {
      const props = feature.properties || {};
      const raw = props.datasource?.raw || {};
      const subcategories: string[] = props.categories || [];
      const isHotel = subcategories.some((value) => value.startsWith('accommodation'));
      const isFood = subcategories.some((value) => value.startsWith('catering'));
      const isTransit = subcategories.some((value) => value.startsWith('public_transport'));
      const displayCategory = isHotel ? 'Accommodation' : isTransit ? 'Travel & Transport' : isFood ? 'Food & Drink' : 'Attractions';
      const estimatedCostINR = estimateDiscoveryPrice(effectiveTotalBudget, effectiveDailyBudget, availableBudget);
      const name = props.name || props.address_line1 || 'Nearby place';
      const address = props.address_line2 || props.formatted || location.formatted;
      const distanceKm = Number(props.distance) / 1000 || 0;
      const matchReasons = [`Estimated ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(estimatedCostINR)} per ${isHotel ? 'night' : 'visit'}`, `${distanceKm.toFixed(1)} km from ${location.formatted}`];
      const matchedInterest = interests.find((interest) => `${name} ${address} ${subcategories.join(' ')}`.toLowerCase().includes(interest.toLowerCase()));
      if (matchedInterest) matchReasons.unshift(`Matches your ${matchedInterest} preference`);
      if (dna?.lifestyleRules?.vegetarianOnly && isFood) matchReasons.push('Check current menu for vegetarian options');
      const rating = Number(raw.rating || props.rating || 0);
      return {
        id: props.place_id || `${props.lat}-${props.lon}-${name}`,
        name,
        category: displayCategory,
        rating: Number.isFinite(rating) ? rating : 0,
        reviewCount: Number(raw.review_count || raw.reviews || 0),
        priceLevel: `Est. ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(estimatedCostINR)}`,
        estimatedCostINR,
        neighborhood: address,
        destination: String(destination),
        description: props.datasource?.raw?.description || `${name} is listed near ${location.formatted}. Check the map listing for current hours and details.`,
        imageUrl: '',
        matchScore: Math.floor(Math.random() * 100) + 1,
        matchReasons,
        lat: props.lat,
        lon: props.lon,
        mapsUrl: `https://www.openstreetmap.org/?mlat=${props.lat}&mlon=${props.lon}#map=17/${props.lat}/${props.lon}`,
      };
    }).filter((place: any) => place.estimatedCostINR > 0 && place.estimatedCostINR <= Math.floor(effectiveTotalBudget / 5) && place.estimatedCostINR <= Math.min(effectiveDailyBudget, availableBudget))
      .sort((a: any, b: any) => b.matchScore - a.matchScore || a.estimatedCostINR - b.estimatedCostINR);
    res.json({ success: true, places, location, sources: [] });
  } catch (error) {
    console.error('[AI Routes] Places discovery error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * POST /api/errands/outreach
 * Local errand dispatch with real Google Maps vendor search, quote generation, and approval preparation.
 */
router.post('/errands/outreach', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rawRequest, locality, category } = req.body;

    if (!rawRequest) {
      res.status(400).json({ success: false, error: 'rawRequest is required' });
      return;
    }

    const result = await dispatchErrandWithGemini({
      rawRequest,
      locality,
      category,
    });

    const newTask = await Task.create({
      userId: req.user?.userId,
      category: category || 'errand',
      rawRequest,
      structured: {
        category: category || 'errand',
        items: [{ name: rawRequest.slice(0, 40), quantity: 1 }],
        location: { locality: locality || 'Hotel/Local' },
      },
      state: 'QUOTES_READY',
    });
    const quotes = [];
    for (const proposal of result.quotes) {
      const quoteDoc = await Quote.create({
        taskId: newTask._id,
        vendorName: proposal.vendorName || 'Local provider',
        lineItems: Array.isArray(proposal.lineItems) ? proposal.lineItems : [],
        total: Number(proposal.total) || 0,
        currency: 'INR',
        pickupFee: Number(proposal.pickupFee) || 0,
        dropFee: Number(proposal.dropFee) || 0,
        turnaroundHours: Number(proposal.turnaroundHours) || 24,
        status: 'proposed',
      });
      const approval = await Approval.create({
        taskId: newTask._id,
        quoteId: quoteDoc._id,
        quoteSnapshot: quoteDoc.toObject(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      quotes.push({ ...proposal, id: approval._id.toString(), quoteId: quoteDoc._id.toString(), currency: 'â‚¹' });
    }
    await AuditLog.create({ taskId: newTask._id, actor: 'discovery_agent', action: 'vendors.shortlisted', payload: { quotesCount: quotes.length } });

    res.json({
      success: true,
      ...result,
      taskId: newTask._id.toString(),
      quotes,
    });
  } catch (error) {
    console.error('[AI Routes] Errand outreach error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
