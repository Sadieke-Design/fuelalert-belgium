/**
 * Shell Belgium - Station Locator
 *
 * Official Shell Retail Locator API
 *
 * Retrieves Shell stations in Belgium using geographical
 * bounding-box requests.
 */

const SHELL_API =
  'https://shellretaillocator.geoapp.me/api/v2/locations/within_bounds';

const SHELL_HEADERS = {
  'User-Agent': 'FuelAlert Belgium/1.0',
  Accept: 'application/json',
};

/**
 * Belgium is split into several bounding boxes because the
 * Shell API can return clusters when the requested area is
 * too large.
 */
const BELGIUM_BOUNDS = [
  {
    name: 'west',
    swLat: 50.70,
    swLng: 2.50,
    neLat: 51.10,
    neLng: 4.00,
  },
  {
    name: 'east',
    swLat: 50.50,
    swLng: 5.00,
    neLat: 51.10,
    neLng: 6.40,
  },
  {
    name: 'southwest',
    swLat: 49.45,
    swLng: 2.50,
    neLat: 50.50,
    neLng: 5.00,
  },
  {
    name: 'southeast',
    swLat: 49.45,
    swLng: 5.00,
    neLat: 50.50,
    neLng: 6.40,
  },
];

/**
 * Build a Shell API URL for one bounding box.
 */
function buildShellUrl(bounds) {
  const params = new URLSearchParams();

  params.append('sw[]', String(bounds.swLat));
  params.append('sw[]', String(bounds.swLng));
  params.append('ne[]', String(bounds.neLat));
  params.append('ne[]', String(bounds.neLng));

  params.append('with_any[fuel_type][]', 'conventional');
  params.append('locale', 'fr_BE');
  params.append('format', 'json');
  params.append('driving_distances', 'false');

  return `${SHELL_API}?${params.toString()}`;
}

/**
 * Fetch one bounding box from Shell.
 */
async function fetchShellBounds(bounds) {
  const url = buildShellUrl(bounds);

  const response = await fetch(url, {
    method: 'GET',
    headers: SHELL_HEADERS,
  });

  if (!response.ok) {
    throw new Error(
      `Shell API returned HTTP ${response.status} for ${bounds.name}`
    );
  }

  const data = await response.json();

  return {
    locations: Array.isArray(data.locations) ? data.locations : [],
    clusters: Array.isArray(data.clusters) ? data.clusters : [],
  };
}

/**
 * Normalize one Shell station.
 */
function normalizeShellStation(station) {
  return {
    source: 'shell',
    external_id: String(station.id),

    name: station.name || null,
    brand: station.brand || 'Shell',

    latitude:
      station.lat !== undefined && station.lat !== null
        ? Number(station.lat)
        : null,

    longitude:
      station.lng !== undefined && station.lng !== null
        ? Number(station.lng)
        : null,

    address: station.address || null,
    city: station.city || null,
    postcode: station.postcode || null,
    state: station.state || null,
    country: station.country || 'Belgium',
    country_code: station.country_code || 'BE',

    telephone: station.telephone || null,
    website_url: station.website_url || null,

    inactive: Boolean(station.inactive),

    site_category: station.site_category || null,
    operator_name: station.operator_name || null,

    amenities: Array.isArray(station.amenities)
      ? station.amenities
      : [],

    raw: station,
  };
}

/**
 * Fetch all Belgian Shell stations.
 *
 * The four bounding boxes are combined and duplicate
 * station IDs are removed.
 */
export async function fetchShellStations() {
  const allStations = [];

  for (const bounds of BELGIUM_BOUNDS) {
    const result = await fetchShellBounds(bounds);

    allStations.push(...result.locations);

    console.log(
      `[Shell] ${bounds.name}: ${result.locations.length} locations`
    );

    if (result.clusters.length > 0) {
      console.warn(
        `[Shell] ${bounds.name}: ${result.clusters.length} clusters returned`
      );
    }
  }

  const uniqueStations = new Map();

  for (const station of allStations) {
    if (!station?.id) {
      continue;
    }

    const id = String(station.id);

    if (!uniqueStations.has(id)) {
      uniqueStations.set(id, normalizeShellStation(station));
    }
  }

  const stations = Array.from(uniqueStations.values());

  console.log(
    `[Shell] Total unique stations: ${stations.length}`
  );

  return stations;
}

export default {
  fetchShellStations,
};