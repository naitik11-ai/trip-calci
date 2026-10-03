const STORAGE_KEY = 'fairshare_trips_data_v1';
const ACTIVE_TRIP_KEY = 'fairshare_active_trip_id_v1';

export const SAMPLE_TRIP = {
  id: 'trip-goa-2026',
  name: 'Goa Weekend Road Trip',
  currencySymbol: '₹',
  currencyCode: 'INR',
  createdAt: new Date().toISOString(),
  members: [
    { id: 'm-1', name: 'Naitik', upiId: 'naitik@upi', colorIdx: 0 },
    { id: 'm-2', name: 'Rahul', upiId: 'rahul@oksbi', colorIdx: 1 },
    { id: 'm-3', name: 'Aman', upiId: 'aman@paytm', colorIdx: 2 },
    { id: 'm-4', name: 'Sneha', upiId: 'sneha@ybl', colorIdx: 3 },
  ],
  expenses: [
    {
      id: 'exp-1',
      title: 'Highway Toll & Petrol',
      category: 'travel',
      amount: 3200,
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      paidById: 'm-1', // Naitik paid all 3200
      payers: [{ memberId: 'm-1', amount: 3200 }],
      splitType: 'equal',
      splits: [
        { memberId: 'm-1', amount: 800 },
        { memberId: 'm-2', amount: 800 },
        { memberId: 'm-3', amount: 800 },
        { memberId: 'm-4', amount: 800 },
      ],
      notes: 'Shell Petrol Pump on Highway'
    },
    {
      id: 'exp-2',
      title: 'Beach Shack Seafood & Drinks',
      category: 'food',
      amount: 4800,
      date: new Date(Date.now() - 86400000).toISOString(),
      // Multi-payer: Rahul paid 3000, Aman paid 1800
      payers: [
        { memberId: 'm-2', amount: 3000 },
        { memberId: 'm-3', amount: 1800 },
      ],
      splitType: 'custom',
      // Sneha didn't drink alcohol, so she pays less
      splits: [
        { memberId: 'm-1', amount: 1400 },
        { memberId: 'm-2', amount: 1400 },
        { memberId: 'm-3', amount: 1400 },
        { memberId: 'm-4', amount: 600 },
      ],
      notes: 'Curlies Anjuna Beach'
    },
    {
      id: 'exp-3',
      title: 'Beach Villa Stay (2 Nights)',
      category: 'stay',
      amount: 8000,
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      paidById: 'm-3', // Aman paid
      payers: [{ memberId: 'm-3', amount: 8000 }],
      splitType: 'equal',
      splits: [
        { memberId: 'm-1', amount: 2000 },
        { memberId: 'm-2', amount: 2000 },
        { memberId: 'm-3', amount: 2000 },
        { memberId: 'm-4', amount: 2000 },
      ],
      notes: 'Airbnb Villa in Vagator'
    },
    {
      id: 'exp-4',
      title: 'Water Sports & Jet Ski',
      category: 'activities',
      amount: 4500,
      date: new Date().toISOString(),
      paidById: 'm-4', // Sneha paid
      payers: [{ memberId: 'm-4', amount: 4500 }],
      splitType: 'equal',
      // Aman skipped water sports, split among Naitik, Rahul, Sneha
      splits: [
        { memberId: 'm-1', amount: 1500 },
        { memberId: 'm-2', amount: 1500 },
        { memberId: 'm-4', amount: 1500 },
      ],
      notes: 'Baga Watersports Club'
    }
  ],
  settlements: []
};

export function loadTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time initial load: preload sample trip so the app isn't empty!
      const initial = [SAMPLE_TRIP];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [SAMPLE_TRIP];
  } catch (err) {
    console.error('Failed to load trips from localStorage:', err);
    return [SAMPLE_TRIP];
  }
}

export function saveTrips(trips) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('Failed to save trips to localStorage:', err);
  }
}

export function loadActiveTripId() {
  try {
    return localStorage.getItem(ACTIVE_TRIP_KEY) || 'trip-goa-2026';
  } catch {
    return 'trip-goa-2026';
  }
}

export function saveActiveTripId(id) {
  try {
    localStorage.setItem(ACTIVE_TRIP_KEY, id);
  } catch (err) {
    console.error('Failed to save active trip id:', err);
  }
}
