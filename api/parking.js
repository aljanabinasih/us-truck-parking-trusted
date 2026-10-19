
module.exports = async function handler(req, res) {
  res.setHeader(
    'Cache-Control',
    's-maxage=60, stale-while-revalidate=300'
  );

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const vals = ['south', 'north', 'west', 'east'].map(
    key => Number(req.query[key])
  );

  if (!vals.every(Number.isFinite)) {
    return res.status(400).json({
      error: 'Map bounds are missing or invalid.'
    });
  }

  const [south, north, west, east] = vals;

  if (
    south < 24 || north > 50 ||
    west < -126 || east > -66 ||
    south >= north || west >= east ||
    north - south > 0.25 || east - west > 0.30
  ) {
    return res.status(400).json({
      error: 'Please search a smaller area within the contiguous United States.'
    });
  }

  const bbox = `${south},${west},${north},${east}`;

  const query =
    `[out:json][timeout:20];(` +
    `nwr["amenity"="parking"]["hgv"~"yes|designated|permissive"](${bbox});` +
    `nwr["amenity"="parking"]["truck"~"yes|designated|permissive"](${bbox});` +
    `nwr["highway"="rest_area"](${bbox});` +
    `nwr["highway"="services"](${bbox});` +
    `);out center tags 80;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  const errors = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json',
          'User-Agent': 'US-Truck-Parking-Trusted/1.0'
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(24000)
      });

      if (!response.ok) {
        errors.push(`${endpoint}: HTTP ${response.status}`);
        continue;
      }

      const body = await response.json();

      if (!body || !Array.isArray(body.elements)) {
        errors.push(`${endpoint}: Invalid response`);
        continue;
      }

      const seen = new Set();

      const elements = body.elements.map(el => {
        const lat = Number(el.lat ?? el.center?.lat);
        const lon = Number(el.lon ?? el.center?.lon);

        return {
          type: el.type,
          id: el.id,
          lat,
          lon,
          tags: el.tags || {}
        };
      }).filter(el => {
        const key = `${el.type}/${el.id}`;

        if (
          !Number.isFinite(el.lat) ||
          !Number.isFinite(el.lon) ||
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);
        return true;
      });

      return res.status(200).json({
        elements,
        count: elements.length,
        provider: 'OpenStreetMap via Overpass API',
        fetchedAt: new Date().toISOString(),
        notice: 'Community map data; not verified live and not a guarantee of truck access, safety, legality, or availability.'
      });

    } catch (error) {
      errors.push(
        `${endpoint}: ${error.name === 'TimeoutError' ? 'Timeout' : 'Connection error'}`
      );
    }
  }

  console.error('All Overpass providers failed:', errors);

  return res.status(502).json({
    error: 'Map data is temporarily unavailable from the public providers. Please try again later.',
    providersTried: endpoints.length
  });
};
