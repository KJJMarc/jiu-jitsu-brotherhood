/**
 * JJB Club Network roster — static verified data.
 * Coordinates geocoded once via Nominatim (OpenStreetMap) from verified addresses.
 * Do not invent locations; do not runtime-geocode.
 */

export type ClubVenue = {
  id: string;
  label?: string;
  addressLines: string[];
  city: string;
  /** Static WGS84 from verified address geocode */
  lat: number;
  lng: number;
  /** Google Maps directions/search link */
  directionsUrl: string;
};

export type ClubAcademy = {
  id: string;
  name: string;
  logoSrc: string;
  websiteUrl: string;
  websiteLabel: string;
  venues: ClubVenue[];
};

function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Alphabetical roster (Bahamas first). VT Jiu Jitsu removed.
 * Poderoso: one academy, two venues / two map pins.
 */
export const clubNetworkAcademies: ClubAcademy[] = [
  {
    id: "bahamas",
    name: "Bahamas Jiu Jitsu",
    logoSrc: "/images/jjb/club-network/bahamas.png",
    websiteUrl: "https://bahamasjiujitsu.com",
    websiteLabel: "bahamasjiujitsu.com",
    venues: [
      {
        id: "bahamas",
        addressLines: [
          "Old Fort Bay Shopping Centre",
          "Building B, Unit 8 (Above NRG)",
          "Nassau, New Providence",
          "The Bahamas",
        ],
        city: "Nassau, The Bahamas",
        // Nominatim: Old Fort Bay administrative area, New Providence
        lat: 25.0438012,
        lng: -77.5055027,
        directionsUrl: mapsUrl(
          "Old Fort Bay Shopping Centre, Building B Unit 8, Nassau, The Bahamas",
        ),
      },
    ],
  },
  {
    id: "black-flag",
    name: "Black Flag Submission Company",
    logoSrc: "/images/jjb/club-network/black-flag.png",
    websiteUrl: "https://www.blackflagaz.com",
    websiteLabel: "blackflagaz.com",
    venues: [
      {
        id: "black-flag",
        addressLines: [
          "3593 W. Northern Ave, Suite 7",
          "Phoenix, AZ 85051",
          "United States",
        ],
        city: "Phoenix, AZ",
        lat: 33.5530117,
        lng: -112.137153,
        directionsUrl: mapsUrl(
          "3593 W Northern Ave Suite 7, Phoenix, AZ 85051",
        ),
      },
    ],
  },
  {
    id: "blackstone",
    name: "Blackstone Jiu Jitsu",
    logoSrc: "/images/jjb/club-network/blackstone.png",
    websiteUrl: "https://www.blackstonejiujitsu.com",
    websiteLabel: "blackstonejiujitsu.com",
    venues: [
      {
        id: "blackstone",
        addressLines: [
          "957 N Main St",
          "Blackstone, Virginia 23824",
          "United States",
        ],
        city: "Blackstone, VA",
        lat: 37.0900476,
        lng: -77.9937103,
        directionsUrl: mapsUrl("957 N Main St, Blackstone, VA 23824"),
      },
    ],
  },
  {
    id: "centre-line-hove",
    name: "Centre Line Jiu Jitsu Hove",
    logoSrc: "/images/jjb/club-network/centre-line.png",
    websiteUrl: "https://centrelinehove.co.uk",
    websiteLabel: "centrelinehove.co.uk",
    venues: [
      {
        id: "centre-line-hove",
        addressLines: [
          "24 Turner Place, School Road",
          "Hove, BN3 5QU",
          "United Kingdom",
        ],
        city: "Hove, UK",
        lat: 50.8353666,
        lng: -0.1890652,
        directionsUrl: mapsUrl("24 Turner Place, School Road, Hove BN3 5QU"),
      },
    ],
  },
  {
    id: "centre-line-worthing",
    name: "Centre Line Jiu Jitsu Worthing",
    logoSrc: "/images/jjb/club-network/centre-line.png",
    websiteUrl: "https://www.worthingmartialarts.co.uk",
    websiteLabel: "worthingmartialarts.co.uk",
    venues: [
      {
        id: "centre-line-worthing",
        addressLines: [
          "Unit 3, Southcourt Workshops",
          "Southcourt Road, Worthing",
          "West Sussex, BN14 7DF",
          "United Kingdom",
        ],
        city: "Worthing, UK",
        lat: 50.8191422,
        lng: -0.3765914,
        directionsUrl: mapsUrl(
          "Southcourt Workshops, Southcourt Road, Worthing BN14 7DF",
        ),
      },
    ],
  },
  {
    id: "foundations",
    name: "Foundations BJJ Academy",
    logoSrc: "/images/jjb/club-network/foundations.png",
    websiteUrl: "http://www.foundationsbjj.com",
    websiteLabel: "foundationsbjj.com",
    venues: [
      {
        id: "foundations",
        addressLines: [
          "2716 Atwood Ave",
          "Madison, Wisconsin",
          "United States",
        ],
        city: "Madison, WI",
        lat: 43.0939765,
        lng: -89.3443088,
        directionsUrl: mapsUrl("2716 Atwood Ave, Madison, Wisconsin"),
      },
    ],
  },
  {
    id: "kingston",
    name: "Kingston Jiu Jitsu – Mauricio Gomes Legacy Team",
    logoSrc: "/images/jjb/club-network/kingston.png",
    websiteUrl: "https://www.kingstonjiujitsu.com",
    websiteLabel: "kingstonjiujitsu.com",
    venues: [
      {
        id: "kingston",
        addressLines: [
          "Tiffin Sports Centre",
          "Queen Elizabeth Road",
          "Kingston upon Thames, KT2 6RL",
          "United Kingdom",
        ],
        city: "Kingston upon Thames, UK",
        // Existing verified Tiffin coordinates (lib/site venues)
        lat: 51.4113273,
        lng: -0.2936959,
        directionsUrl: mapsUrl(
          "Tiffin Sports Centre, Queen Elizabeth Road, Kingston upon Thames KT2 6RL",
        ),
      },
    ],
  },
  {
    id: "mgjj-west-london",
    name: "Mauricio Gomes Jiu Jitsu Legacy West London",
    logoSrc: "/images/jjb/club-network/mgjj-west-london.png",
    websiteUrl: "https://www.westlondonjiujitsu.co.uk",
    websiteLabel: "westlondonjiujitsu.co.uk",
    venues: [
      {
        id: "mgjj-west-london",
        addressLines: [
          "Saint Barnabas Church",
          "Raglan Way, Northolt UB5 4SX",
          "United Kingdom",
        ],
        city: "Northolt, UK",
        lat: 51.5503109,
        lng: -0.3531621,
        directionsUrl: mapsUrl("Saint Barnabas Church, Raglan Way, Northolt UB5 4SX"),
      },
    ],
  },
  {
    id: "poderoso",
    name: "Poderoso Jiu-Jitsu Brotherhood",
    logoSrc: "/images/jjb/club-network/poderoso.png",
    websiteUrl: "https://jjbqc.org/listing/poderoso-jiu-jitsu-brotherhood/",
    websiteLabel: "jjbqc.org",
    venues: [
      {
        id: "poderoso-masson",
        label: "Masson",
        addressLines: [
          "2745 Rue Masson",
          "Montréal, QC H1Y 1W6",
          "Canada",
        ],
        city: "Montréal, QC",
        lat: 45.5469356,
        lng: -73.5758185,
        directionsUrl: mapsUrl("2745 Rue Masson, Montréal, QC H1Y 1W6"),
      },
      {
        id: "poderoso-langelier",
        label: "Langelier",
        addressLines: [
          "8604 Boul Langelier",
          "Saint-Léonard, Montréal, QC H1P 2Y7",
          "Canada",
        ],
        city: "Saint-Léonard, QC",
        lat: 45.5984171,
        lng: -73.5912076,
        directionsUrl: mapsUrl(
          "8604 Boulevard Langelier, Saint-Léonard, Montréal, QC H1P 2Y7",
        ),
      },
    ],
  },
  {
    id: "rob-taylor",
    name: "Rob Taylor Jiu Jitsu Academy",
    logoSrc: "/images/jjb/club-network/rob-taylor.png",
    websiteUrl: "https://cardiffbjj.co.uk",
    websiteLabel: "cardiffbjj.co.uk",
    venues: [
      {
        id: "rob-taylor",
        addressLines: [
          "Unit 3a Gulf Works, Penarth Road",
          "Cardiff, CF11 8TY",
          "United Kingdom",
        ],
        city: "Cardiff, UK",
        // Nominatim postcode CF11 8TY
        lat: 51.4628125,
        lng: -3.1920331,
        directionsUrl: mapsUrl(
          "Unit 3a Gulf Works, Penarth Road, Cardiff CF11 8TY",
        ),
      },
    ],
  },
  {
    id: "triccs",
    name: "Triccs Academy",
    logoSrc: "/images/jjb/club-network/triccs.png",
    websiteUrl: "https://www.dulwichbjj.com",
    websiteLabel: "dulwichbjj.com",
    venues: [
      {
        id: "triccs",
        addressLines: [
          "Dulwich College Sports Club",
          "College Road, London, SE21 7LE",
          "United Kingdom",
        ],
        city: "Dulwich, London",
        lat: 51.4428303,
        lng: -0.0846225,
        directionsUrl: mapsUrl(
          "Dulwich College Sports Club, College Road, London SE21 7LE",
        ),
      },
    ],
  },
  {
    id: "vanquish",
    name: "Vanquish Jiu Jitsu Belfast",
    logoSrc: "/images/jjb/club-network/vanquish.png",
    websiteUrl: "https://www.facebook.com/jiujitsubrotherhoodbelfast",
    websiteLabel: "Facebook",
    venues: [
      {
        id: "vanquish",
        addressLines: [
          "93–95 Ravenhill Rd",
          "Belfast, BT6 8EB",
          "United Kingdom",
        ],
        city: "Belfast, UK",
        lat: 54.5949595,
        lng: -5.911598,
        directionsUrl: mapsUrl("93-95 Ravenhill Road, Belfast BT6 8EB"),
      },
    ],
  },
];

export type ClubMapPin = {
  venueId: string;
  academyId: string;
  academyName: string;
  city: string;
  websiteUrl: string;
  websiteLabel: string;
  lat: number;
  lng: number;
  venueLabel?: string;
};

export function clubNetworkMapPins(): ClubMapPin[] {
  return clubNetworkAcademies.flatMap((academy) =>
    academy.venues.map((venue) => ({
      venueId: venue.id,
      academyId: academy.id,
      academyName: academy.name,
      city: venue.city,
      websiteUrl: academy.websiteUrl,
      websiteLabel: academy.websiteLabel,
      lat: venue.lat,
      lng: venue.lng,
      venueLabel: venue.label,
    })),
  );
}
