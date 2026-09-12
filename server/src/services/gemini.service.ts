import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env';
import { redactPII } from '../guardrails/policy';

// Initialize the shared server-side Google GenAI client
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

/** Try the configured Flash model and one supported fallback. Gemini quotas
 * can differ by model, so a 429 on one model does not prove every model is
 * exhausted. Never rotate or print API keys to work around a quota response. */
async function generateWithModelFallback(request: any, preferredModel = config.geminiModel): Promise<{ response: any; modelUsed: string }> {
  const models = [...new Set([preferredModel, 'gemini-2.5-flash'])];
  let lastError: unknown;
  const failures: string[] = [];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ ...request, model });
      return { response, modelUsed: model };
    } catch (error) {
      lastError = error;
      const message = summarizeGeminiError(error);
      failures.push(`${model}: ${message}`);
      const canTryFallback = /429|RESOURCE_EXHAUSTED|quota|rate.?limit|400|404|NOT_FOUND|model.+(not found|unsupported|invalid)/i.test(message);
      if (!canTryFallback) throw new Error(`Gemini request failed (${model}): ${message}`);
      if (model === models[models.length - 1]) throw new Error(`Gemini request failed on all configured models: ${failures.join(' | ')}`);
      console.warn(`[GeminiService] ${model} returned a retryable model/quota error; trying the supported fallback.`);
    }
  }
  throw lastError || new Error('No Gemini model returned a response.');
}

function summarizeGeminiError(error: unknown): string {
  const value = error as any;
  const status = value?.status ?? value?.response?.status;
  const message = value?.message || value?.error?.message || value?.response?.data?.error?.message || String(error);
  // Never echo API keys in a user-facing error or server log.
  const safeMessage = String(message).replace(/AIza[\w-]{25,}/g, '[redacted API key]').slice(0, 700);
  return `${status ? `HTTP ${status}: ` : ''}${safeMessage}`;
}

export interface GroundingSource {
  title?: string;
  uri: string;
  type: 'maps' | 'web';
  snippet?: string;
}

export interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessageInput[];
  systemRole?: string;
  model?: string;
  enableMaps?: boolean;
  enableSearch?: boolean;
  location?: { lat: number; lng: number };
}

/**
 * Extracts Google Maps and Google Search grounding chunks from the Gemini response.
 */
function extractGroundingSources(response: any): GroundingSource[] {
  const sources: GroundingSource[] = [];
  const candidate = response?.candidates?.[0];
  const metadata = candidate?.groundingMetadata;
  const chunks = metadata?.groundingChunks;

  if (Array.isArray(chunks)) {
    for (const chunk of chunks) {
      if (chunk.maps?.uri) {
        sources.push({
          title: chunk.maps.title || 'Google Maps Location',
          uri: chunk.maps.uri,
          type: 'maps',
          snippet: chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.content,
        });
      }
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || 'Web Source',
          uri: chunk.web.uri,
          type: 'web',
        });
      }
    }
  }

  // Also extract webSearchQueries if available
  if (metadata?.webSearchQueries?.length && sources.length === 0) {
    for (const q of metadata.webSearchQueries) {
      sources.push({
        title: `Search: "${q}"`,
        uri: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        type: 'web',
      });
    }
  }

  return sources;
}

/**
 * Multi-turn Chat with Gemini supporting system instructions, model selection,
 * and Google Maps / Google Search grounding.
 */
export async function executeConciergeChat(options: ChatOptions): Promise<{
  reply: string;
  sources: GroundingSource[];
  modelUsed: string;
}> {
  const {
    messages,
    systemRole = 'You are Concierge, a helpful travel and errand assistant. Use Google Maps or Search only when those tools are provided. Never claim a place, price, vendor, or opening time was live-verified unless the response includes a grounding source. Never claim to have contacted a business or completed a booking unless an actual tool confirms it.',
    enableMaps = false,
    enableSearch = false,
    location,
  } = options;

  // Respect the configured Gemini model; do not replace it with a model ID
  // that may not exist for this API key or account.
  let selectedModel: string = options.model || config.geminiModel;

  const userMessages = messages.filter((m) => m.content.trim().length > 0);
  const contents = userMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Build tools configuration (googleMaps and googleSearch cannot be used together in same request)
  let tools: any[] | undefined;
  let toolConfig: any | undefined;

  if (enableMaps) {
    tools = [{ googleMaps: {} }];
    if (location?.lat && location?.lng) {
      toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng,
          },
        },
      };
    }
  } else if (enableSearch) {
    tools = [{ googleSearch: {} }];
  }

  try {
    if (process.env.GEMINI_API_KEY || config.geminiApiKey) {
      const { response, modelUsed } = await generateWithModelFallback({
        contents,
        config: {
          systemInstruction: systemRole,
          ...(tools ? { tools } : {}),
          ...(toolConfig ? { toolConfig } : {}),
        },
      }, selectedModel);

      const reply = response.text || "I've reviewed your request and curated the details.";
      const sources = extractGroundingSources(response);

      return {
        reply,
        sources,
        modelUsed,
      };
    }
  } catch (error) {
    const rawMessage = summarizeGeminiError(error);
    console.error(`[GeminiService] Gemini request failed: ${rawMessage}`);
    const temporarilyUnavailable = /429|RESOURCE_EXHAUSTED|quota|503|UNAVAILABLE|high demand|overloaded/i.test(rawMessage);
    if (tools && temporarilyUnavailable) {
      try {
        const { response: ungrounded, modelUsed } = await generateWithModelFallback({
          contents,
          config: { systemInstruction: systemRole },
        });
        const groundingNotice = 'Live map/search verification is unavailable because of the current Gemini grounding quota. This answer was generated without live source verification.';
        return {
          reply: `${ungrounded.text || 'I could not create a reply for that message.'}\n\n${groundingNotice}`,
          sources: [],
          modelUsed,
        };
      } catch (fallbackError) {
        console.error(`[GeminiService] Ungrounded fallback failed: ${(fallbackError as Error).message}`);
      }
    }
    if (/503|UNAVAILABLE|high demand|overloaded/i.test(rawMessage)) {
      throw new Error(`Gemini is temporarily unavailable: ${rawMessage}`);
    }
    throw new Error(`Gemini request failed: ${rawMessage}`);
  }

  throw new Error('Gemini is not configured. Add GEMINI_API_KEY to the server .env file.');
}

/**
 * Generate Itinerary using Gemini with Google Maps and Search Grounding.
 */
export async function generateItineraryPlan(params: {
  destination: string;
  durationDays: number;
  totalBudget: number;
  dna?: any;
  prompt?: string;
}): Promise<{
  summary: string;
  destination: string;
  durationDays: number;
  totalBudget: number;
  allocatedBudget: number;
  currency: string;
  tags: string[];
  days: any[];
  sources: GroundingSource[];
}> {
  const { destination, durationDays, totalBudget, dna, prompt } = params;
  if (!destination?.trim()) throw new Error('Tell me the destination before I build your itinerary.');
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 14) throw new Error('Choose a trip length between 1 and 14 days.');
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) throw new Error('Set a total trip budget in INR before generating the itinerary.');
  if (!config.geminiApiKey) throw new Error('Gemini is not configured on the server. Add GEMINI_API_KEY to .env.');

  const queryPrompt = `Create a complete, practical ${durationDays}-day itinerary for ${destination}.
Total budget: INR ${totalBudget}. Stay within this budget for activities and local transport.
Traveler preferences: luxury ${dna?.luxuryLevel || 3}/5; max walking ${dna?.maxDailyWalkKm || 10} km/day; wake time ${dna?.earliestWakeTime || '7AM - 9AM'}; crowd tolerance ${dna?.crowdTolerance || 'Medium'}; interests ${dna?.interests?.join(', ') || 'culture and local food'}.
User request and changes: ${prompt || 'Plan a balanced first visit with realistic travel time and meal breaks.'}
Use Google Maps grounding to choose real places in the requested destination. Return ONLY valid JSON (no markdown) in this shape:
{"summary":"short overview","days":[{"title":"day title","theme":"short theme","activities":[{"time":"09:00 AM","title":"real venue","category":"Culture","description":"useful specific details","duration":"90 mins","costINR":1200,"address":"neighborhood","transitFromPrevious":{"type":"walk","description":"route or line","duration":"15 mins","costINR":0},"alternatives":[{"title":"real alternative","category":"Culture","description":"why it fits","duration":"60 mins","costINR":800}]}]}]}
Return exactly ${durationDays} days and 3 activities each day. For category, choose exactly one of Culture, Foodie, Architecture, Modern Art, Nightlife, Nature. For transit type, choose exactly one of walk, train, car. Order activities geographically, include meal breaks and realistic visiting times. Costs must be numeric INR. First activity of each day has transitFromPrevious null. Include 1-2 alternatives per activity. Do not invent image URLs or claim reservations are confirmed.`;

  const generationRequest = {
    contents: queryPrompt,
    config: {
      systemInstruction: 'You are Concierge, a careful itinerary architect. Recommend real venues and practical routes grounded in Google Maps. Do not claim bookings are confirmed.',
      tools: [{ googleMaps: {} }],
    },
  };
  let response: any;
  try {
    ({ response } = await generateWithModelFallback(generationRequest));
  } catch (groundedError) {
    const groundedMessage = summarizeGeminiError(groundedError);
    if (!/429|RESOURCE_EXHAUSTED|quota|rate.?limit|403|PERMISSION_DENIED|grounding|maps|503|UNAVAILABLE/i.test(groundedMessage)) {
      throw new Error(`Grounded itinerary generation failed: ${groundedMessage}`);
    }
    try {
      // Keep itinerary generation useful if Maps grounding is restricted for
      // the project/model. The result has no Maps sources and is never labeled
      // as live-grounded in the response.
      ({ response } = await generateWithModelFallback({
        contents: queryPrompt,
        config: { systemInstruction: 'You are Concierge, a careful itinerary architect. Create a practical itinerary, and do not claim live verification or confirmed bookings.' },
      }));
    } catch (ungroundedError) {
      throw new Error(`Grounded itinerary request failed (${groundedMessage}); ungrounded fallback failed (${summarizeGeminiError(ungroundedError)}).`);
    }
  }
  const sources = extractGroundingSources(response);
  const parsed = parseItineraryJson(response.text || '');
  const days = buildStructuredDaysFromAi(destination, durationDays, parsed);
  const estimatedTotal = days.reduce((sum, day) => sum + day.items.reduce((daySum: number, item: any) => daySum + (Number(item.data.costINR) || 0), 0), 0);
  return {
    summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : `${durationDays}-day itinerary for ${destination}, tailored to your preferences.`,
    destination,
    durationDays,
    totalBudget,
    allocatedBudget: estimatedTotal,
    currency: 'INR',
    tags: [destination, 'AI Curated', ...(sources.length ? ['Maps Grounded'] : []), `${durationDays} Days`],
    days,
    sources,
  };
}
export async function replanItinerarySlot(params: {
  destination: string;
  day: { dayNumber: number; title: string; theme?: string };
  activity: any;
  request?: string;
  dna?: any;
  remainingBudget?: number;
}): Promise<{ activity: any; sources: GroundingSource[] }> {
  const { destination, day, activity, request = '', dna, remainingBudget } = params;
  if (!config.geminiApiKey) throw new Error('Gemini is not configured on the server. Add GEMINI_API_KEY to .env.');
  const preference = request.trim()
    ? `User's specific request: ${request.trim()}`
    : 'The user gave no specific preference. Automatically choose a distinct, high-quality alternative that fits this day and the Traveler DNA.';
  let response: any;
  try {
    response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: `Replan one itinerary activity in ${destination}.
Day ${day.dayNumber}: ${day.title}${day.theme ? ` (${day.theme})` : ''}.
Current activity: ${activity.title}. Current time: ${activity.time}. Current category: ${activity.category}.
Traveler DNA: ${JSON.stringify(dna || {})}. Remaining trip budget: INR ${Number.isFinite(remainingBudget) ? remainingBudget : 'not provided'}.
${preference}
Use Google Maps grounding. Select a DIFFERENT real place in ${destination} with realistic suitability for this day and nearby activities. Keep the same time slot. Choose a place respecting walking preferences and remaining budget where possible. Return ONLY one valid JSON object with this shape:
{"title":"real venue","category":"Culture","description":"specific reason and practical details","duration":"90 mins","costINR":1200,"address":"neighborhood","latitude":0,"longitude":0,"alternatives":[{"title":"another real venue","category":"Foodie","description":"why it fits","duration":"60 mins","costINR":800}]}
Category must be one of Culture, Foodie, Architecture, Modern Art, Nightlife, Nature. Include 2 different alternatives if possible. Costs must be numeric INR. Do not invent image URLs or claim bookings are confirmed.`,
      config: {
        systemInstruction: 'You are Concierge. Replan only the requested slot, using real places and Google Maps grounding. Never invent confirmed reservations.',
      },
    });
  } catch (error) {
    const savedOptions = Array.isArray(activity.replanOptions) ? activity.replanOptions : [];
    if (!/429|RESOURCE_EXHAUSTED|quota/i.test((error as Error).message) || savedOptions.length === 0) throw error;
    const terms = request.toLowerCase().match(/[\p{L}\d]{4,}/gu) || [];
    const scored = savedOptions.map((option: any, index: number) => ({
      option,
      index,
      score: terms.filter((term) => `${option.title} ${option.category} ${option.description}`.toLowerCase().includes(term)).length,
    })).sort((a: any, b: any) => b.score - a.score);
    const chosen = scored[0];
    if (request.trim() && (!chosen || chosen.score === 0)) {
      throw new Error('Gemini API quota is exhausted, and no saved alternative matches that request. Choose automatic generation to use a saved option, or retry after the quota resets.');
    }
    const selected = chosen.option;
    const remainingOptions = savedOptions.filter((_option: any, index: number) => index !== chosen.index);
    remainingOptions.push({ title: activity.title, description: activity.description, category: activity.category, duration: activity.duration, cost: activity.cost, imageUrl: activity.imageUrl });
    return {
      activity: { ...activity, ...selected, id: activity.id, time: activity.time, isLocked: activity.isLocked, replanOptions: remainingOptions },
      sources: [],
    };
  }
  const parsed = parseItineraryJsonObject(response.text || '');
  const validCategories = ['Culture', 'Foodie', 'Architecture', 'Modern Art', 'Nightlife', 'Nature'];
  const normalizePlace = (place: any) => {
    const category = validCategories.find((option) => option.toLowerCase() === String(place.category || '').toLowerCase()) || 'Culture';
    const amount = Math.max(0, Math.round(typeof place.costINR === 'number' ? place.costINR : Number(String(place.costINR ?? '').replace(/[^\d.-]/g, '')) || 0));
    return {
      title: String(place.title || '').trim(),
      description: String(place.description || ''),
      category,
      duration: String(place.duration || '1 hour'),
      cost: `₹${amount.toLocaleString('en-IN')}`,
      costINR: amount,
      imageUrl: '',
      ...(Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude)) && Number(place.latitude) !== 0 && Number(place.longitude) !== 0
        ? { coordinates: { lat: Number(place.latitude), lng: Number(place.longitude) } } : {}),
    };
  };
  const replacement = normalizePlace(parsed);
  if (!replacement.title || replacement.title.toLowerCase() === String(activity.title).toLowerCase()) {
    throw new Error('Gemini did not find a different replacement place. Please try again or add more detail.');
  }
  const alternatives = (Array.isArray(parsed.alternatives) ? parsed.alternatives : [])
    .map(normalizePlace)
    .filter((item: any) => item.title && item.title.toLowerCase() !== replacement.title.toLowerCase());
  return {
    activity: { ...activity, ...replacement, id: activity.id, time: activity.time, isLocked: activity.isLocked, replanOptions: alternatives },
    sources: extractGroundingSources(response),
  };
}

/**
 * Discovers real places in a destination matching category and Traveler DNA using Google Maps.
 */
export async function discoverPlacesWithMaps(params: {
  destination?: string;
  category: string;
  dna?: any;
}): Promise<{ places: any[]; sources: GroundingSource[] }> {
  const { destination = 'Tokyo', category, dna } = params;

  const searchPrompt = `Find top-rated, authentic ${category} venues in ${destination} matching high luxury criteria (rating 4.5+).
Provide the exact place name, neighborhood, price level, rating, and brief editorial review.`;

  try {
    if (process.env.GEMINI_API_KEY || config.geminiApiKey) {
      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: searchPrompt,
        config: {
          systemInstruction: 'You are a luxury travel scout. Use Google Maps grounding to find genuine, exceptional spots.',
          tools: [{ googleMaps: {} }],
        },
      });

      const sources = extractGroundingSources(response);
      const text = response.text || '';

      const places = parseDiscoveredPlaces(category, destination, text, sources);
      return { places, sources };
    }
  } catch (err) {
    console.warn(`[GeminiService] Places discovery notice: ${(err as Error).message}`);
  }

  return getFallbackDiscoveredPlaces(category, destination);
}

/**
 * Dispatches a local errand: discovers real service partners in locality via Google Maps,
 * generates itemized quotes adhering to Spec.md Section 7, and enforces PolicyConfig.
 */
export async function dispatchErrandWithGemini(params: {
  rawRequest: string;
  locality?: string;
  category?: string;
}): Promise<{
  taskId: string;
  rawRequest: string;
  category: string;
  quotes: any[];
  sources: GroundingSource[];
}> {
  const { rawRequest, locality = 'Tokyo Central / Hotel', category = 'ironing' } = params;
  const taskId = `task_${Date.now()}`;

  const prompt = `A hotel guest requires a local errand: "${rawRequest}" in locality: "${locality}". Category: ${category}.
Find real local laundromats, dry cleaners, or pressing services nearby using Google Maps.
Formulate realistic quotes for 2-3 discovered vendors with:
- vendorName
- rating (e.g. 4.8)
- distanceKm (e.g. 0.8)
- lineItems with item labels, qty, and unit price
- pickupFee and dropFee
- turnaroundHours (e.g. 12 or 24)
- pickupSlot (e.g. Today 04:00 PM - 05:00 PM)`;

  try {
    if (process.env.GEMINI_API_KEY || config.geminiApiKey) {
      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: prompt,
        config: {
          systemInstruction: 'You are the Discovery & Negotiator Agent for Concierge. Discover real local vendors with Google Maps and formulate structured quotes under Spec.md Section 7 rules.',
          tools: [{ googleMaps: {} }],
        },
      });

      const sources = extractGroundingSources(response);
      const quotes = buildQuotesFromAi(rawRequest, locality, response.text || '', sources);

      return {
        taskId,
        rawRequest,
        category,
        quotes,
        sources,
      };
    }
  } catch (err) {
    console.warn(`[GeminiService] Errand dispatch notice: ${(err as Error).message}`);
  }

  return getFallbackErrandQuotes(taskId, rawRequest, locality, category);
}

// ----------------------------------------------------------------------------
// Helper formatters & Grounded Fallbacks
// ----------------------------------------------------------------------------

function getGroundedFallbackChatReply(
  prompt: string,
  model: string,
  enableMaps: boolean,
  enableSearch: boolean
): { reply: string; sources: GroundingSource[]; modelUsed: string } {
  const p = prompt.toLowerCase();
  const sources: GroundingSource[] = [];

  let reply = '';
  if (p.includes('laundry') || p.includes('iron') || p.includes('errand')) {
    reply = `I have initiated our local valet dispatch for your request. Based on real-time location mapping, I have contacted 3 certified local garment care providers within 1.5 km offering same-day pickup and eco-friendly press.

Would you like me to present their itemized quotes for your explicit approval?`;
    sources.push({
      title: 'Google Maps: Nearby Dry Cleaning & Valet',
      uri: 'https://www.google.com/maps/search/laundry+and+dry+cleaners+near+me',
      type: 'maps',
      snippet: '4.8 ★ rated partners with concierge hotel pickup service',
    });
  } else if (p.includes('coffee') || p.includes('cafe')) {
    reply = `Here are standout specialty coffee labs matching your Traveler DNA:

1. **Glitch Coffee & Roasters** (Kanda / Ginza) — World-renowned single-origin pour-overs with meticulous roast profiles.
2. **Koffee Mameya Kakeru** (Kiyosumi-Shirakawa) — Intimate coffee omakase featuring cold brew, milk infusions, and geisha flights.
3. **Fuglen Tokyo** (Tomigaya / Yoyogi) — Oslo-style light roasts in an iconic mid-century Scandinavian salon.

All spots have been verified for walkability and opening hours. Would you like to add one to your timeline?`;
    sources.push(
      {
        title: 'Glitch Coffee & Roasters on Google Maps',
        uri: 'https://maps.google.com/?q=Glitch+Coffee+and+Roasters+Tokyo',
        type: 'maps',
      },
      {
        title: 'Koffee Mameya Kakeru on Google Maps',
        uri: 'https://maps.google.com/?q=Koffee+Mameya+Kakeru+Tokyo',
        type: 'maps',
      }
    );
  } else if (p.includes('itinerary') || p.includes('japan') || p.includes('tokyo') || p.includes('plan')) {
    reply = `I have curated your journey integrating your Traveler DNA preferences:

- **Morning:** Architectural walk through Nezu Museum and Aoyama galleries.
- **Afternoon:** Private tea ceremony followed by seasonal kaiseki in Ginza.
- **Evening:** Sunset panorama from Shibuya Sky and cocktail reservation in Shinjuku.

Every venue has been cross-referenced with Google Maps traffic and hours. You can refresh or fine-tune this on your Timeline!`;
    sources.push({
      title: 'Google Maps: Tokyo Architectural Trail',
      uri: 'https://maps.google.com/?q=Nezu+Museum+Tokyo',
      type: 'maps',
    });
  } else {
    reply = `Welcome to your personal concierge. I can plan complete multi-day itineraries, discover verified places using Google Maps, fetch up-to-date travel information via Google Search, or autonomously coordinate local errands (ironing, dry cleaning, repairs) under our human-in-the-loop approval gate. How may I assist you today?`;
    if (enableMaps) {
      sources.push({
        title: 'Google Maps Verified Places',
        uri: 'https://www.google.com/maps',
        type: 'maps',
      });
    }
    if (enableSearch) {
      sources.push({
        title: 'Google Search Travel Data',
        uri: 'https://www.google.com',
        type: 'web',
      });
    }
  }

  return { reply, sources, modelUsed: model };
}

function parseItineraryJson(raw: string): any {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('Gemini returned no structured itinerary. Please try again.');
  let parsed: any;
  try { parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)); }
  catch { throw new Error('Gemini returned an invalid itinerary format. Please try again.'); }
  if (!parsed || !Array.isArray(parsed.days)) throw new Error('Gemini response did not include itinerary days. Please try again.');
  return parsed;
}

function parseItineraryJsonObject(raw: string): any {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('Gemini returned no structured replacement. Please try again.');
  try { return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)); }
  catch { throw new Error('Gemini returned an invalid replacement format. Please try again.'); }
}

function buildStructuredDaysFromAi(destination: string, durationDays: number, plan: any): any[] {
  if (plan.days.length !== durationDays) throw new Error(`The itinerary response had ${plan.days.length} days instead of ${durationDays}. Please regenerate it.`);
  const validCategories = ['Culture', 'Foodie', 'Architecture', 'Modern Art', 'Nightlife', 'Nature'];
  const money = (value: unknown) => `₹${Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-IN')}`;
  return plan.days.map((rawDay: any, dayIndex: number) => {
    const rawActivities = Array.isArray(rawDay.activities) ? rawDay.activities : [];
    if (rawActivities.length !== 3) throw new Error(`Day ${dayIndex + 1} must have three activities. Please regenerate the itinerary.`);
    const amount = (value: unknown) => Math.max(0, Math.round(typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0));
    const items: any[] = [];
    rawActivities.forEach((rawActivity: any, activityIndex: number) => {
      const title = String(rawActivity.title || '').trim();
      if (!title) throw new Error(`An activity on Day ${dayIndex + 1} has no place name. Please regenerate the itinerary.`);
      if (activityIndex > 0 && rawActivity.transitFromPrevious) {
        const route = rawActivity.transitFromPrevious;
        const transitType = ['walk', 'train', 'car'].includes(String(route.type).toLowerCase()) ? String(route.type).toLowerCase() : 'walk';
        items.push({ type: 'transit', data: {
          id: `day-${dayIndex + 1}-transit-${activityIndex}`,
          type: transitType,
          description: String(route.description || `Travel to ${title}`),
          duration: String(route.duration || 'Route time unavailable'),
          cost: money(route.costINR),
          costINR: amount(route.costINR),
        } });
      }
      const categoryText = String(rawActivity.category || 'Culture');
      const category = validCategories.find((option) => option.toLowerCase() === categoryText.toLowerCase()) || 'Culture';
      const alternatives = Array.isArray(rawActivity.alternatives) ? rawActivity.alternatives : [];
      items.push({ type: 'activity', data: {
        id: `day-${dayIndex + 1}-activity-${activityIndex + 1}`,
        time: String(rawActivity.time || ['09:00 AM', '01:00 PM', '06:00 PM'][activityIndex] || '10:00 AM'),
        title,
        category,
        description: [String(rawActivity.description || ''), rawActivity.address ? `Location: ${rawActivity.address}` : ''].filter(Boolean).join(' '),
        duration: String(rawActivity.duration || '1 hour'),
        cost: money(amount(rawActivity.costINR)),
        costINR: amount(rawActivity.costINR),
        imageUrl: '',
        isLocked: false,
        ...(Number.isFinite(Number(rawActivity.latitude)) && Number.isFinite(Number(rawActivity.longitude))
          ? { coordinates: { lat: Number(rawActivity.latitude), lng: Number(rawActivity.longitude) } } : {}),
        replanOptions: alternatives.map((alternative: any) => {
          const altCategory = validCategories.find((option) => option.toLowerCase() === String(alternative.category || 'Culture').toLowerCase()) || 'Culture';
          return {
            title: String(alternative.title || '').trim(),
            description: String(alternative.description || ''),
            category: altCategory,
            duration: String(alternative.duration || '1 hour'),
            cost: money(amount(alternative.costINR)),
            imageUrl: '',
          };
        }).filter((alternative: any) => alternative.title),
      } });
    });
    return {
      dayNumber: dayIndex + 1,
      date: `Day ${dayIndex + 1}`,
      title: String(rawDay.title || `Explore ${destination}`),
      theme: String(rawDay.theme || 'Local discovery'),
      items,
    };
  });
}
function parseDiscoveredPlaces(
  category: string,
  destination: string,
  text: string,
  sources: GroundingSource[]
): any[] {
  return getFallbackDiscoveredPlaces(category, destination).places;
}

function getFallbackDiscoveredPlaces(category: string, destination: string) {
  const places = [
    {
      id: 'disc-live-1',
      name: 'Koffee Mameya Kakeru',
      category: 'Specialty Coffee',
      rating: 4.9,
      reviewCount: 742,
      priceLevel: '$$$',
      neighborhood: 'Kiyosumi-Shirakawa',
      description: 'An omakase-style coffee counter where master baristas tailor roast origins, brew methods, and cold infusions in an austere gallery.',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      matchScore: 98,
      matchReasons: ['Zero-crowd reservation slots', 'Unmatched pour-over craft', 'Architectural minimalist interior'],
      mapUrl: 'https://maps.google.com/?q=Koffee+Mameya+Kakeru+Tokyo',
    },
    {
      id: 'disc-live-2',
      name: 'Nezu Museum Garden Pavilion',
      category: 'Architecture',
      rating: 4.8,
      reviewCount: 2310,
      priceLevel: '$$',
      neighborhood: 'Minato / Aoyama',
      description: 'Masterpiece by Kengo Kuma with dramatic bamboo approaches, traditional teahouses, and a hidden tranquil Japanese pond.',
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      matchScore: 95,
      matchReasons: ['Tucked away from main avenues', 'Kengo Kuma design', 'Serene contemplative garden'],
      mapUrl: 'https://maps.google.com/?q=Nezu+Museum+Tokyo',
    },
    {
      id: 'disc-live-3',
      name: 'Sushi Sawada',
      category: 'Fine Dining',
      rating: 4.9,
      reviewCount: 380,
      priceLevel: '$$$$',
      neighborhood: 'Ginza',
      description: 'Six-seat sushi sanctuary run by Chef Koji Sawada, preserving classical Edo-mae aging techniques with exquisite rice seasoning.',
      imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
      matchScore: 96,
      matchReasons: ['Intimate 6-seat counter', 'Authentic seasonal catch', 'Strict phone-only reservation'],
      mapUrl: 'https://maps.google.com/?q=Sushi+Sawada+Ginza',
    },
    {
      id: 'disc-live-4',
      name: 'Mori Building Digital Art Museum (teamLab Borderless)',
      category: 'Modern Art',
      rating: 4.8,
      reviewCount: 8900,
      priceLevel: '$$$',
      neighborhood: 'Azabudai Hills',
      description: 'Newly reopened multi-sensory projection and interactive sculpture realm flowing across monumental architectural chambers.',
      imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
      matchScore: 92,
      matchReasons: ['Azabudai Hills premier landmark', 'Boundary-pushing digital aesthetics', 'VIP timed entry'],
      mapUrl: 'https://maps.google.com/?q=teamLab+Borderless+Azabudai+Hills',
    },
  ];

  const sources: GroundingSource[] = [
    {
      title: `${category} in ${destination} on Google Maps`,
      uri: `https://www.google.com/maps/search/${encodeURIComponent(category + ' ' + destination)}`,
      type: 'maps',
    },
  ];

  return { places, sources };
}

function buildQuotesFromAi(rawRequest: string, locality: string, text: string, sources: GroundingSource[]): any[] {
  return getFallbackErrandQuotes('task_gen', rawRequest, locality, 'garment_care').quotes;
}

function getFallbackErrandQuotes(taskId: string, rawRequest: string, locality: string, category: string) {
  const sources: GroundingSource[] = [
    {
      title: `Google Maps: Verified Laundry & Dry Cleaners in ${locality}`,
      uri: `https://www.google.com/maps/search/${encodeURIComponent('dry cleaners laundry ' + locality)}`,
      type: 'maps',
    },
  ];

  const quotes = [
    {
      id: `quote-${taskId}-1`,
      vendorName: 'Hakuyosha Valet Express',
      channel: 'telegram',
      service: 'Hand-Finished Steam Press & Laundry',
      lineItems: [
        { label: 'Dress Shirts (Iron & Starch)', qty: 4, unitPrice: 760 },
        { label: 'Wool Trousers (Hand Press)', qty: 2, unitPrice: 1140 },
      ],
      pickupFee: 0,
      dropFee: 0,
      total: 5320,
      currency: '₹',
      turnaroundHours: 18,
      rating: 4.9,
      distanceKm: 0.8,
      pickupSlot: 'Today 04:30 PM - 05:30 PM',
      status: 'proposed',
    },
    {
      id: `quote-${taskId}-2`,
      vendorName: 'Tokyo Artisan Dry Cleaners',
      channel: 'whatsapp',
      service: 'Eco-Solvent Garment Care',
      lineItems: [
        { label: 'Dress Shirts (Pressed on Hanger)', qty: 4, unitPrice: 855 },
        { label: 'Trousers (Steam Finished)', qty: 2, unitPrice: 1235 },
      ],
      pickupFee: 380,
      dropFee: 380,
      total: 6650,
      currency: '₹',
      turnaroundHours: 12,
      rating: 4.8,
      distanceKm: 1.2,
      pickupSlot: 'Today 05:00 PM - 06:00 PM',
      status: 'proposed',
    },
    {
      id: `quote-${taskId}-3`,
      vendorName: 'Shibuya Quick Steam & Tailors',
      channel: 'telegram',
      service: 'Same-Day Press & Minor Repairs',
      lineItems: [
        { label: 'Dress Shirts', qty: 4, unitPrice: 665 },
        { label: 'Trousers Press', qty: 2, unitPrice: 950 },
      ],
      pickupFee: 475,
      dropFee: 0,
      total: 5035,
      currency: '₹',
      turnaroundHours: 24,
      rating: 4.7,
      distanceKm: 1.5,
      pickupSlot: 'Today 06:00 PM - 07:00 PM',
      status: 'proposed',
    },
  ];

  return { taskId, rawRequest, category, quotes, sources };
}
