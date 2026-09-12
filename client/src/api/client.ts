/**
 * API client communicating with Express backend using httpOnly cookies / credentials
 */

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Include credentials for httpOnly cookies
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; uptime: number; database: { connected: boolean; state: string } }>('/health'),

  mapPlaces: (body: { lat: number; lon: number; category?: string }) => request<{ success: boolean; places: any[]; mapUrl: string }>('/places/nearby', { method: 'POST', body: JSON.stringify(body) }),
  geocodePlace: (text: string) => request<{ success: boolean; location: { lat: number; lon: number; formatted: string } }>(`/places/geocode?text=${encodeURIComponent(text)}`),

  // Auth
  register: (body: { email: string; password: string; name: string; phoneNumber?: string; homeCity?: string; countryOfResidence?: string; timezone?: string }) =>
    request<{ success: boolean; user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ success: boolean; user: any }>('/auth/me'),

  savePreferences: (preferences: any) => request<{ success: boolean; user: any }>('/auth/preferences', {
    method: 'PATCH', body: JSON.stringify({ preferences }),
  }),

  saveProfile: (profile: { name: string; phoneNumber?: string; homeCity?: string; countryOfResidence?: string; preferredCurrency?: string }) => request<{ success: boolean; user: any }>('/auth/profile', {
    method: 'PATCH', body: JSON.stringify(profile),
  }),

  saveWorkspace: (workspace: { tripOverview?: any; itineraryDays?: any[]; expenses?: any[]; tripPages?: any[]; activeTripId?: string | null; pastTrips?: any[] }) => request<{ success: boolean; workspace: any }>('/auth/workspace', {
    method: 'PATCH', body: JSON.stringify(workspace),
  }),

  // Tasks
  getTasks: () =>
    request<{ success: boolean; tasks: any[] }>('/tasks'),

  getTask: (id: string) =>
    request<{ success: boolean; task: any }>(`/tasks/${id}`),

  createTask: (body: { rawRequest: string; category?: string; structured?: any }) =>
    request<{ success: boolean; task: any }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  cancelTask: (id: string) =>
    request<{ success: boolean; task: any }>(`/tasks/${id}/cancel`, {
      method: 'POST',
    }),

  getQuotes: (taskId: string) =>
    request<{ success: boolean; quotes: any[] }>(`/tasks/${taskId}/quotes`),

  // AI Chat & Multi-turn Assistant (Gemini with Maps & Search Grounding)
  chat: (body: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    model?: string;
    enableMaps?: boolean;
    enableSearch?: boolean;
    location?: { lat: number; lng: number };
  }) =>
    request<{
      success: boolean;
      reply: string;
      sources: Array<{ title?: string; uri: string; type: 'maps' | 'web'; snippet?: string }>;
      modelUsed: string;
    }>('/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // AI Itinerary Generation (Google Maps Grounded)
  generateItinerary: (body: {
    destination: string;
    durationDays?: number;
    totalBudget?: number;
    dna?: any;
    prompt?: string;
  }) =>
    request<{
      success: boolean;
      summary: string;
      destination: string;
      durationDays: number;
      totalBudget: number;
      allocatedBudget: number;
      currency: string;
      tags: string[];
      days: any[];
      sources: Array<{ title?: string; uri: string; type: 'maps' | 'web' }>;
    }>('/itinerary/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  replanItinerarySlot: (body: { destination: string; day: any; activity: any; request?: string; dna?: any; remainingBudget?: number }) =>
    request<{ success: boolean; activity: any; sources: Array<{ title?: string; uri: string; type: 'maps' | 'web' }> }>('/itinerary/replan-slot', {
      method: 'POST', body: JSON.stringify(body),
    }),

  // Nearby Geoapify Places Discovery
  discoverPlaces: (body: { category: string; destination?: string; dna?: any; budgetPerDay?: number; totalBudget?: number; durationDays?: number; remainingBudget?: number }) =>
    request<{
      success: boolean;
      places: any[];
      sources: Array<{ title?: string; uri: string; type: 'maps' | 'web' }>;
    }>('/places/discover', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Local Errand Outreach & Negotiation
  dispatchErrand: (body: { rawRequest: string; locality?: string; category?: string }) =>
    request<{
      success: boolean;
      taskId: string;
      rawRequest: string;
      category: string;
      quotes: any[];
      sources: Array<{ title?: string; uri: string; type: 'maps' | 'web' }>;
    }>('/errands/outreach', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Human Approval Gate (Spec.md Section 9)
  grantApproval: (approvalId: string) =>
    request<{ success: boolean; approval: any }>(`/approvals/${approvalId}/grant`, {
      method: 'POST',
    }),

  rejectApproval: (approvalId: string) =>
    request<{ success: boolean; approval: any }>(`/approvals/${approvalId}/reject`, {
      method: 'POST',
    }),

  // Direct Payment Confirmation (Spec.md Section 8)
  confirmPayment: (taskId: string, body: { amount: number; method: string; reference?: string; approvalId: string }) =>
    request<{ success: boolean; message: string; task: any; purchase: any }>(`/tasks/${taskId}/payment-confirmation`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
