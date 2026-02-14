// src/lib/venue.ts

export type VenueStatus = "OPEN" | "CLOSED";

export type VenueSettings = {
  venueId: string;
  name: string;
  status: VenueStatus;

  prepMinutes: number;

  collectionEnabled: boolean;
  deliveryEnabled: boolean;

  createdAt: number;
  updatedAt: number;
};

const keyVenue = (venueId: string) => `venue:${venueId}`;
const keyVenueList = () => `venues:index`;

export async function getVenue(
  kv: KVNamespace,
  venueId: string
): Promise<VenueSettings | null> {
  const raw = await kv.get(keyVenue(venueId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as VenueSettings;
  } catch {
    return null;
  }
}

export async function writeVenue(
  kv: KVNamespace,
  venue: VenueSettings
): Promise<void> {
  await kv.put(keyVenue(venue.venueId), JSON.stringify(venue));

  const idxRaw = await kv.get(keyVenueList());
  let ids: string[] = [];

  try {
    ids = idxRaw ? (JSON.parse(idxRaw) as string[]) : [];
  } catch {
    ids = [];
  }

  if (!ids.includes(venue.venueId)) {
    ids.push(venue.venueId);
    await kv.put(keyVenueList(), JSON.stringify(ids));
  }
}

export async function listVenues(
  kv: KVNamespace
): Promise<VenueSettings[]> {
  const idxRaw = await kv.get(keyVenueList());
  let ids: string[] = [];

  try {
    ids = idxRaw ? (JSON.parse(idxRaw) as string[]) : [];
  } catch {
    ids = [];
  }

  const venues: VenueSettings[] = [];

  for (const id of ids) {
    const v = await getVenue(kv, id);
    if (v) venues.push(v);
  }

  return venues;
}

export function makeVenueDefaults(
  venueId: string,
  name = "New Venue"
): VenueSettings {
  const now = Date.now();

  return {
    venueId,
    name,
    status: "OPEN",

    prepMinutes: 15,

    collectionEnabled: true,
    deliveryEnabled: false,

    createdAt: now,
    updatedAt: now,
  };
}
