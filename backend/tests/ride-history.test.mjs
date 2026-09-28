import assert from "node:assert/strict";
import { once } from "node:events";
import { after, afterEach, before, mock, test } from "node:test";
import { app } from "../dist/app.js";
import { AppError } from "../dist/common/errors/AppError.js";
import { signAccessToken } from "../dist/common/utils/jwt.js";
import { UserRole } from "../dist/generated/prisma/client.js";
import { driverService } from "../dist/modules/driver/driver.service.js";
import { buildPoolHistoryWhere, poolService } from "../dist/modules/pool/pool.service.js";
import { rideRequestService } from "../dist/modules/ride-request/ride-request.service.js";

const ids = {
    passengerA: "11111111-1111-4111-8111-111111111111",
    passengerB: "22222222-2222-4222-8222-222222222222",
    driverA: "33333333-3333-4333-8333-333333333333",
    driverB: "44444444-4444-4444-8444-444444444444",
    pool: "55555555-5555-4555-8555-555555555555",
};
const lifecycleHistory = [
    { eventType: "REQUESTED", note: null },
    { eventType: "MATCHED", note: null },
    { eventType: "DRIVER_ARRIVED", note: null },
    { eventType: "STARTED", note: null },
    { eventType: "COMPLETED", note: null },
];
const cancelledRide = {
    id: "66666666-6666-4666-8666-666666666666",
    requestedSeats: 2,
    estimatedFare: 900,
    status: "CANCELLED",
    pickupZone: { id: "pickup", name: "Pickup" },
    destinationZone: { id: "destination", name: "Destination" },
    poolMember: {
        poolId: ids.pool,
        fare: 900,
        status: "CANCELLED",
        leftAt: "2026-01-02T03:04:05.000Z",
        pool: { id: ids.pool, status: "MATCHED", history: lifecycleHistory.slice(0, 2) },
    },
};

let server;
let origin;
let tokens;

before(async () => {
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    origin = "http://127.0.0.1:" + server.address().port;
    tokens = {
        passengerA: await signAccessToken({ sub: ids.passengerA, role: UserRole.PASSENGER }),
        passengerB: await signAccessToken({ sub: ids.passengerB, role: UserRole.PASSENGER }),
        driverA: await signAccessToken({ sub: ids.driverA, role: UserRole.DRIVER }),
        driverB: await signAccessToken({ sub: ids.driverB, role: UserRole.DRIVER }),
    };
});
afterEach(() => mock.restoreAll());
after(async () => {
    if (server) {
        server.close();
        await once(server, "close");
    }
});
async function get(path, token) {
    const response = await fetch(origin + path, {
        headers: { authorization: "Bearer " + token },
    });
    return { status: response.status, body: await response.json() };
}

test("passenger history uses the authenticated ID and includes cancelled request/member state", async () => {
    const calls = [];
    mock.method(rideRequestService, "getHistoryByPassenger", async (passengerId) => {
        calls.push(passengerId);
        return passengerId === ids.passengerA ? [cancelledRide] : [];
    });
    const response = await get("/api/v1/ride-requests/history", tokens.passengerA);
    assert.equal(response.status, 200);
    assert.deepEqual(calls, [ids.passengerA]);
    assert.equal(response.body.data[0].status, "CANCELLED");
    assert.equal(response.body.data[0].poolMember.status, "CANCELLED");
    assert.equal(response.body.data[0].poolMember.leftAt, cancelledRide.poolMember.leftAt);
});

test("passenger history excludes another passenger's ride", async () => {
    mock.method(rideRequestService, "getHistoryByPassenger", async (passengerId) =>
        passengerId === ids.passengerB ? [{ id: "passenger-b-ride" }] : [],
    );
    const response = await get("/api/v1/ride-requests/history", tokens.passengerB);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.map((ride) => ride.id), ["passenger-b-ride"]);
    assert.equal(response.body.data.some((ride) => ride.id === cancelledRide.id), false);
});

test("driver history uses the authenticated driver ID and retains the lifecycle timeline", async () => {
    const calls = [];
    mock.method(driverService, "getRideHistory", async (driverId) => {
        calls.push(driverId);
        return driverId === ids.driverA ? [{ id: ids.pool, history: lifecycleHistory }] : [];
    });
    const response = await get("/api/v1/driver/ride-history", tokens.driverA);
    assert.equal(response.status, 200);
    assert.deepEqual(calls, [ids.driverA]);
    assert.deepEqual(response.body.data[0].history, lifecycleHistory);
});

test("driver history excludes another driver's pool", async () => {
    mock.method(driverService, "getRideHistory", async (driverId) =>
        driverId === ids.driverB ? [{ id: "driver-b-pool" }] : [],
    );
    const response = await get("/api/v1/driver/ride-history", tokens.driverB);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.map((pool) => pool.id), ["driver-b-pool"]);
    assert.equal(response.body.data.some((pool) => pool.id === ids.pool), false);
});

test("pool-history route permits its driver/member passenger and rejects an unrelated passenger", async () => {
    const calls = [];
    mock.method(poolService, "getHistory", async (poolId, userId, role) => {
        calls.push({ poolId, userId, role });
        if (
            poolId === ids.pool &&
            ((role === UserRole.DRIVER && userId === ids.driverA) ||
                (role === UserRole.PASSENGER && userId === ids.passengerA))
        ) return { id: ids.pool, history: lifecycleHistory };
        throw new AppError("Insufficient permissions", 403, "FORBIDDEN");
    });
    const path = "/api/v1/pools/" + ids.pool + "/history";
    const driver = await get(path, tokens.driverA);
    const passenger = await get(path, tokens.passengerA);
    const unrelated = await get(path, tokens.passengerB);
    assert.equal(driver.status, 200);
    assert.equal(passenger.status, 200);
    assert.equal(unrelated.status, 403);
    assert.deepEqual(driver.body.data.history, lifecycleHistory);
    assert.deepEqual(passenger.body.data.history, lifecycleHistory);
    assert.deepEqual(calls.map((call) => call.userId), [ids.driverA, ids.passengerA, ids.passengerB]);
});

test("pool history query filters enforce owner/member scope and preserve shared events", () => {
    assert.deepEqual(
        buildPoolHistoryWhere(ids.pool, ids.driverA, UserRole.DRIVER),
        { id: ids.pool, driverId: ids.driverA },
    );
    assert.deepEqual(
        buildPoolHistoryWhere(ids.pool, ids.passengerA, UserRole.PASSENGER),
        { id: ids.pool, members: { some: { passengerId: ids.passengerA } } },
    );
    assert.equal(lifecycleHistory.at(-1).eventType, "COMPLETED");
});
