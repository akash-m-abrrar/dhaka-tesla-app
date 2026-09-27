# Driver Availability and Ride Request Visibility: Postman Guide

This guide covers the current local API flow from driver setup through viewing pending ride requests. It also shows how to create a passenger request so the driver list has something to return.

## 1. Postman environment

Create a Postman environment with these variables:

| Variable | Example / value |
| --- | --- |
| `baseUrl` | `http://localhost:5000/api/v1` |
| `driverToken` | Save from driver login response |
| `passengerToken` | Save from passenger login response |
| `vehicleId` | Save from vehicle creation response |
| `pickupZoneId` | Copy from `GET {{baseUrl}}/zones` |
| `destinationZoneId` | Copy from `GET {{baseUrl}}/zones` |

For protected requests, add this header:

```http
Authorization: Bearer {{driverToken}}
```

Use `{{passengerToken}}` for passenger requests. For JSON bodies, set `Content-Type: application/json` (Postman does this when **Body → raw → JSON** is selected).

## 2. Check the API and database

```http
GET {{baseUrl}}/health
```

No authentication is required. Expect HTTP `200` and `success: true`.

## 3. Create or prepare a driver account

Skip registration if you already have a driver account. Otherwise:

### Register

```http
POST {{baseUrl}}/auth/register
```

Body → raw → JSON:

```json
{
  "name": "Postman Driver",
  "email": "driver@example.com",
  "password": "test-pass-123"
}
```

Expect HTTP `201`. A new account starts with the `PASSENGER` role.

### Log in before applying

```http
POST {{baseUrl}}/auth/login
```

```json
{
  "email": "driver@example.com",
  "password": "test-pass-123"
}
```

Expect HTTP `200`. Copy `data.accessToken` from the response and use it as a Bearer token for the next request.

### Apply to become a driver

```http
POST {{baseUrl}}/auth/driver-application
Authorization: Bearer <accessToken-from-login>
```

```json
{
  "licenseNumber": "DL-POSTMAN-001",
  "vehicleModel": "Tesla Model 3",
  "vehiclePlateNumber": "DHAKA-METRO-GA-1234"
}
```

Expect HTTP `201`. In the current backend this application is approved immediately and the user role changes to `DRIVER`.

**Log in again after applying.** The access token issued before the role change still contains the old `PASSENGER` role. Save the new login response’s `data.accessToken` as `driverToken`.

## 4. Create a vehicle

```http
POST {{baseUrl}}/vehicles
Authorization: Bearer {{driverToken}}
```

```json
{
  "model": "Tesla Model 3",
  "plateNumber": "DHAKA-METRO-GA-1234"
}
```

Expect HTTP `201`. The backend sets capacity to `3` and initial status to `OFFLINE`. Save `data.id` as `vehicleId`.

You can view your vehicles with:

```http
GET {{baseUrl}}/vehicles
Authorization: Bearer {{driverToken}}
```

This returns only vehicles owned by the authenticated driver.

## 5. Load zone IDs for the passenger request

```http
GET {{baseUrl}}/zones
```

No authentication is required. Choose two different zones and copy their `id` values into `pickupZoneId` and `destinationZoneId`. A seeded example pair is **Banani Commercial Area** to **Gulshan 2 Circle**; use the IDs returned by your own API.

## 6. Create a pending ride request as a passenger

If needed, register and log in a separate passenger account using the same `/auth/register` and `/auth/login` requests. Save that login’s `data.accessToken` as `passengerToken`.

```http
POST {{baseUrl}}/ride-requests
Authorization: Bearer {{passengerToken}}
```

```json
{
  "pickupZoneId": "{{pickupZoneId}}",
  "destinationZoneId": "{{destinationZoneId}}",
  "requestedSeats": 1
}
```

Expect HTTP `201`. The response’s `data` includes the request ID, `status: "PENDING"`, and server-calculated `estimatedFare` in integer paisa. Do not send `estimatedFare`; the API rejects extra fields.

Passengers can see their own requests with:

```http
GET {{baseUrl}}/ride-requests
Authorization: Bearer {{passengerToken}}
```

## 7. Set the driver online or offline

### Go online

```http
PATCH {{baseUrl}}/vehicles/{{vehicleId}}/status
Authorization: Bearer {{driverToken}}
```

```json
{
  "status": "ONLINE"
}
```

Expect HTTP `200`, with `data.status` equal to `ONLINE`.

### Go offline

Use the same URL and headers with:

```json
{
  "status": "OFFLINE"
}
```

Expect HTTP `200`, with `data.status` equal to `OFFLINE`. Only the `status` field is accepted; do not send `ownerId`, `driverId`, or other fields.

## 8. View pending requests as an online driver

Set at least one of your vehicles to `ONLINE`, then call:

```http
GET {{baseUrl}}/driver/ride-requests
Authorization: Bearer {{driverToken}}
```

Expect HTTP `200`. The response is `data: [...]`; each item contains only the information needed to review a request, for example:

```json
{
  "success": true,
  "data": [
    {
      "id": "<ride-request-id>",
      "requestedSeats": 1,
      "createdAt": "<timestamp>",
      "pickupZone": {
        "name": "Banani Commercial Area"
      },
      "destinationZone": {
        "name": "Gulshan 2 Circle"
      }
    }
  ]
}
```

Passenger identity and fare are not included. For this MVP, every pending request is shown to every online driver because drivers are not assigned to zones yet. `MATCHED`, `ACCEPTED`, and `CANCELLED` requests are excluded. If the driver has no online vehicle, the response is an empty array.

## 9. Useful checks and expected errors

| Check | Expected result |
| --- | --- |
| Passenger token calls `PATCH /vehicles/:id/status` | `403 FORBIDDEN` |
| Passenger token calls `GET /driver/ride-requests` | `403 FORBIDDEN` |
| Driver tries to update another driver’s vehicle | `404 NOT_FOUND` (ownership-safe) |
| Status is not `ONLINE` or `OFFLINE` | `400 VALIDATION_ERROR` |
| Status body contains `ownerId` or another extra field | `400 VALIDATION_ERROR` |
| Driver is offline and requests the list | `200`, `data: []` |

Errors use the standard response shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "..."
  }
}
```

## 10. Current scope

This flow supports driver online/offline status and viewing eligible pending requests. It does not accept a request, match rides, assign a zone, or advance a trip. The request list is currently unpaginated and may contain pending requests from all seeded zones.
