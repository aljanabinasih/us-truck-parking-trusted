// Server-side Overpass proxy. Results are community map data, not live availability.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const vals = ['south','north','west','east'].map(k => Number(req.query[k]));
  if (!vals.every(Number.isFinite)) return res.status(400).json({ error: 'Map bounds are missing or invalid.' });
  const [south,north,west,east] = vals;
  if (south < 24 || north > 50 || west < -126 || east > -66 || south >= north || west >= east || north-south > 0.25 || east-west > 0.30) {
    return res.status(400).json({ error: 'Please search a smaller area within the contiguous United States.' });
  }
  const bbox = `${south},${west},${north},${east}`;
  const query = `[out:json][timeout:20];(nwr["amenity"="parking"]["hgv"~"yes|designated|permissive"](${bbox});nwr["amenity"="parking"]["truck"~"yes|designated|permissive"](${bbox});nwr["highway"="rest_area"](${bbox});nwr["highway"="services"](${bbox}););out center tags 80;`;
  const endpoints = ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let lastStatus = 502;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'Accept': 'application/json', 'User-Agent': 'US-Truck-Parking-Trusted/1.0 (public informational map)' }, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(24000) });
      if (!response.ok) { lastStatus = response.status; continue; }
      const body = await response.json();
      if (!body || !Array.isArray(body.elements)) { lastStatus = 502; continue; }
      const seen = new Set();
      const elements = body.elements.map(el => {
        const lat = Number(el.lat ?? el.center?.lat), lon = Number(el.lon ?? el.center?.lon);
        return { type: el.type, id: el.id, lat, lon, tags: el.tags || {} };
      }).filter(el => Number.isFinite(el.lat) && Number.isFinite(el.lon) && !seen.has(`${el.type}/${el.id}`) && seen.add(`${el.type}/${el.id}`));
      return res.status(200).json({ elements, count: elements.length, provider: 'OpenStreetMap via Overpass API', fetchedAt: new Date().toISOString(), notice: 'Community mapping data; not verified live and not a guarantee of truck access, safety, legality, or availability.' });
    } catch (error) {
      lastStatus = error.name === 'TimeoutError' ? 504 : 502;
    }
  }
  return res.status(lastStatus).json({ error: lastStatus === 504 ? 'The map-data service timed out. Please try again later.' : 'Map data is temporarily unavailable from the public providers. No substitute or sample locations were shown.' });
};
