# US Truck Parking Trusted

A small, serverless informational map for truck-parking-related locations in the contiguous United States. Built as static HTML + Leaflet and two Vercel Node.js serverless functions.

## Included files

- `index.html` — search interface, map, results, and explicit data-quality warnings.
- `api/search.js` — server-side place lookup through Nominatim.
- `api/parking.js` — server-side Overpass query for selected OpenStreetMap tags.

## Deploy to Vercel

1. Upload these files and the `api` folder to the root of your GitHub repository. Keep the folder name exactly `api`.
2. In Vercel, choose **Add New → Project**, import `aljanabinasih/us-truck-parking-trusted`, and deploy with the default settings. No build command or API key is required for this first version.
3. Open the deployed URL and search a city/state or ZIP code.
4. If a deployment fails, open the Vercel deployment's **Build Logs** and **Functions Logs**. Do not assume it works until both API endpoints have been tested.

## API routes

- `/api/search?q=Greensboro%2C%20NC`
- `/api/parking?south=36.0&north=36.1&west=-80.0&east=-79.9`

## Accuracy and safety limits

- OpenStreetMap is community-maintained. Data can be incomplete, inaccurate, or outdated.
- The timestamp means the server fetched a response at that time; it is **not** a field inspection timestamp.
- A parking, rest-area, or service-area tag does not prove that tractor-trailers are permitted, spaces are open, overnight parking is allowed, or the location is safe.
- This first version does not provide live occupancy, reservation capability, official truck restrictions, verified fees, or verified amenities.
- When the provider fails, the API returns an error rather than invented/sample locations.
- Public geocoding and Overpass services have usage policies and can rate-limit or temporarily reject requests. For a commercial/high-traffic product, review provider policies and consider a contracted data service or self-hosting.

## Providers and attribution

- OpenStreetMap contributors: https://www.openstreetmap.org/copyright
- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- Leaflet: https://leafletjs.com/

This project is an informational map, not a parking operator, reservation service, or guarantee of accuracy, legality, safety, or availability.
