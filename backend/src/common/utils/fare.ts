/**
 * MVP estimated fare in Bangladeshi paisa (100 paisa = ৳1).
 * Fare = 3,000 paisa base + 1,500 paisa per started straight-line kilometre.
 * The Haversine distance is rounded up to a whole kilometre before pricing.
 * This is a deterministic estimate, not road distance or a navigation quote.
 */
export const BASE_FARE_PAISA = 3_000;
export const FARE_PER_KILOMETRE_PAISA = 1_500;
const EARTH_RADIUS_METRES = 6_371_000;
const METRES_PER_KILOMETRE = 1_000;

export interface ZoneCoordinates {
    latitude: number;
    longitude: number;
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

export function calculateEstimatedFare(
    pickup: ZoneCoordinates,
    destination: ZoneCoordinates,
): number {
    const latitudeDelta = toRadians(destination.latitude - pickup.latitude);
    const longitudeDelta = toRadians(destination.longitude - pickup.longitude);
    const pickupLatitude = toRadians(pickup.latitude);
    const destinationLatitude = toRadians(destination.latitude);

    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(pickupLatitude) *
            Math.cos(destinationLatitude) *
            Math.sin(longitudeDelta / 2) ** 2;
    const distanceMetres =
        2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(haversine));
    const chargedKilometres = Math.ceil(distanceMetres / METRES_PER_KILOMETRE);

    return BASE_FARE_PAISA + chargedKilometres * FARE_PER_KILOMETRE_PAISA;
}
