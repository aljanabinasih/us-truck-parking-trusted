// Server-side geocoding proxy for Vercel. No API key is required.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const q = String(req.query.q || '').trim();
  if (!q || q.length > 120) return res.status(400).json({ error: 'Enter a city, state, or ZIP code (maximum 120 characters).' });
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q + ', USA'); url.searchParams.set('format', 'jsonv2'); url.searchParams.set('limit', '1'); url.searchParams.set('countrycodes', 'us'); url.searchParams.set('addressdetails', '1');
    const response = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'US-Truck-Parking-Trusted/1.0 (public informational map)' }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return res.status(502).json({ error: `Location search provider returned HTTP ${response.status}. Try again later.` });
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) return res.status(404).json({ error: 'Could not find that US location. Try adding the state or using a ZIP code.' });
    const row = rows[0]; const raw = row.boundingbox;
    if (!Array.isArray(raw) || raw.length !== 4) return res.status(502).json({ error: 'Location provider returned incomplete map bounds.' });
    let [south, north, west, east] = raw.map(Number);
    // Cap large city/country bounding boxes to a manageable local search window.
    const centerLat = Number(row.lat), centerLon = Number(row.lon);
    if (![south,north,west,east,centerLat,centerLon].every(Number.isFinite)) return res.status(502).json({ error: 'Location provider returned invalid coordinates.' });
    const maxLatSpan = 0.20, maxLonSpan = 0.25;
    if (north - south > maxLatSpan) { south = centerLat - maxLatSpan/2; north = centerLat + maxLatSpan/2; }
    if (east - west > maxLonSpan) { west = centerLon - maxLonSpan/2; east = centerLon + maxLonSpan/2; }
    return res.status(200).json({ display_name: row.display_name, lat: centerLat, lon: centerLon, bbox: [south,north,west,east], provider: 'Nominatim / OpenStreetMap', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ error: error.name === 'TimeoutError' ? 'Location search timed out. Try again.' : 'Location search is temporarily unavailable. Try again later.' });
  }
};
