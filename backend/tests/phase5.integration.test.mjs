import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { app } from "../dist/app.js";
import { prisma } from "../dist/config/database.js";
import { env } from "../dist/config/env.js";
import { calculateEstimatedFare } from "../dist/common/utils/fare.js";

let server;
let origin;
const created = { userIds: [], vehicleIds: [], poolIds: [], requestIds: [] };

before(async () => {
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    origin = `http://127.0.0.1:${server.address().port}`;
    await prisma.$queryRaw`SELECT 1`;
});

after(async () => {
    if (server) {
        server.close();
        await once(server, "close");
    }
    if (created.poolIds.length) {
        await prisma.payment.deleteMany({ where: { poolMember: { poolId: { in: created.poolIds } } } });
        await prisma.rideHistory.deleteMany({ where: { poolId: { in: created.poolIds } } });
        await prisma.poolMember.deleteMany({ where: { poolId: { in: created.poolIds } } });
        await prisma.pool.deleteMany({ where: { id: { in: created.poolIds } } });
    }
    if (created.requestIds.length) {
        await prisma.rideRequest.deleteMany({ where: { id: { in: created.requestIds } } });
    }
    if (created.vehicleIds.length) {
        await prisma.vehicle.deleteMany({ where: { id: { in: created.vehicleIds } } });
    }
    if (created.userIds.length) {
        await prisma.driverApplication.deleteMany({ where: { userId: { in: created.userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: created.userIds } } });
    }
    await prisma.$disconnect();
});

async function request(path, { method = "GET", token, body } = {}) {
    const response = await fetch(origin + path, {
        method,
        headers: {
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
}

async function register(name, suffix) {
    const result = await request("/api/v1/auth/register", {
        method: "POST",
        body: { name, email: `${suffix}@phase5.invalid`, password: "Phase5-password-42" },
    });
    assert.equal(result.status, 201, JSON.stringify(result.body));
    const user = result.body.data.user;
    created.userIds.push(user.id);
    assert.equal("passwordHash" in user, false);
    assert.equal("password" in user, false);
    return { user, email: `${suffix}@phase5.invalid`, password: "Phase5-password-42" };
}

async function login(account) {
    const result = await request("/api/v1/auth/login", {
        method: "POST",
        body: { email: account.email, password: account.password },
    });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return result.body.data.accessToken;
}

test("Phase 5 HTTP + PostgreSQL regression: auth, ownership, real capacity race, lifecycle, cancellation, fare, payment, and history", async () => {
    const tag = randomUUID().replaceAll("-", "").slice(0, 12);
    const passengerA = await register("Phase Five Passenger A", `p5a-${tag}`);

    const duplicate = await request("/api/v1/auth/register", {
        method: "POST",
        body: { name: passengerA.user.name, email: passengerA.email, password: passengerA.password },
    });
    assert.equal(duplicate.status, 409);
    assert.equal((await request("/api/v1/auth/register", { method: "POST", body: { email: "bad" } })).status, 400);
    assert.equal((await request("/api/v1/auth/login", { method: "POST", body: { email: passengerA.email, password: "wrong-password" } })).status, 401);
    assert.equal((await request("/api/v1/auth/login", { method: "POST", body: { email: `missing-${tag}@phase5.invalid`, password: "unknown" } })).status, 401);
    assert.equal((await request("/api/v1/auth/me")).status, 401);
    assert.equal((await request("/api/v1/auth/me", { token: "not-a-jwt" })).status, 401);
    const expiredToken = await new SignJWT({ role: "PASSENGER", tokenType: "access" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(randomUUID())
        .setIssuer("dhaka-tesla-pool-api")
        .setAudience("dhaka-tesla-pool-client")
        .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
        .sign(new TextEncoder().encode(env.JWT_ACCESS_SECRET));
    assert.equal((await request("/api/v1/auth/me", { token: expiredToken })).status, 401);

    const passengerToken = await login(passengerA);
    const me = await request("/api/v1/auth/me", { token: passengerToken });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.id, passengerA.user.id);
    assert.equal("passwordHash" in me.body.data.user, false);
    assert.equal((await request("/api/v1/vehicles", { method: "POST", token: passengerToken, body: { model: "Tesla", plateNumber: `P5-${tag}` } })).status, 403);

    const passengerB = await register("Phase Five Passenger B", `p5b-${tag}`);
    const passengerC = await register("Phase Five Passenger C", `p5c-${tag}`);
    const passengerD = await register("Phase Five Passenger D", `p5d-${tag}`);
    const unrelatedPassenger = await register("Phase Five Unrelated Passenger", `p5e-${tag}`);
    const passengerTokens = new Map([
        [passengerA.user.id, passengerToken],
        [passengerB.user.id, await login(passengerB)],
        [passengerC.user.id, await login(passengerC)],
        [passengerD.user.id, await login(passengerD)],
        [unrelatedPassenger.user.id, await login(unrelatedPassenger)],
    ]);
    const driverAccount = await register("Phase Five Driver", `p5driver-${tag}`);
    const otherDriverAccount = await register("Phase Five Other Driver", `p5other-${tag}`);
    let otherDriverToken = await login(otherDriverAccount);

    const application = {
        licenseNumber: `LIC-${tag}`,
        vehicleModel: "Test Tesla",
        vehiclePlateNumber: `APP-${tag}`,
    };
    const applied = await request("/api/v1/auth/driver-application", { method: "POST", token: await login(driverAccount), body: application });
    assert.equal(applied.status, 201, JSON.stringify(applied.body));
    const driverToken = await login(driverAccount);
    assert.equal((await request("/api/v1/auth/driver-application", { method: "POST", token: driverToken, body: application })).status, 409);
    const otherApplied = await request("/api/v1/auth/driver-application", {
        method: "POST", token: otherDriverToken,
        body: { licenseNumber: `LIC2-${tag}`, vehicleModel: "Other Tesla", vehiclePlateNumber: `APP2-${tag}` },
    });
    assert.equal(otherApplied.status, 201, JSON.stringify(otherApplied.body));
    otherDriverToken = await login(otherDriverAccount);

    const vehicleResult = await request("/api/v1/vehicles", {
        method: "POST", token: driverToken,
        body: { model: "Regression Tesla", plateNumber: `CAR-${tag}` },
    });
    assert.equal(vehicleResult.status, 201, JSON.stringify(vehicleResult.body));
    const vehicleId = vehicleResult.body.data.id;
    created.vehicleIds.push(vehicleId);
    assert.equal(vehicleResult.body.data.capacity, 3);
    assert.equal((await request("/api/v1/vehicles", { method: "POST", token: driverToken, body: { model: "Duplicate Tesla", plateNumber: `CAR-${tag}` } })).status, 409);
    assert.equal((await request(`/api/v1/vehicles/${vehicleId}`, { token: otherDriverToken })).status, 403);
    assert.equal((await request(`/api/v1/vehicles/${vehicleId}/status`, { method: "PATCH", token: driverToken, body: { status: "ONLINE" } })).status, 200);
    assert.equal((await request(`/api/v1/vehicles/${vehicleId}/status`, { method: "PATCH", token: driverToken, body: { status: "INVALID" } })).status, 400);

    const zonesResponse = await request("/api/v1/zones");
    assert.equal(zonesResponse.status, 200);
    const zones = zonesResponse.body.data;
    const pickup = zones.find((zone) => zone.name === "Uttara Sector 3 Hub");
    const destination = zones.find((zone) => zone.name === "Gulshan 2 Circle");
    assert.ok(pickup && destination, "baseline zones must be seeded before this integration suite");
    const expectedFare = calculateEstimatedFare(
        { latitude: Number(pickup.latitude), longitude: Number(pickup.longitude) },
        { latitude: Number(destination.latitude), longitude: Number(destination.longitude) },
    );
    assert.equal(expectedFare, 16_500, "Uttara Sector 3 to Gulshan 2 is expected to cost 16,500 paisa");
    assert.ok(expectedFare > 0);
    await assert.rejects(
        prisma.rideRequest.create({
            data: {
                passengerId: randomUUID(), pickupZoneId: pickup.id,
                destinationZoneId: destination.id, requestedSeats: 1,
                estimatedFare: expectedFare,
            },
        }),
        (error) => error?.code === "P2003",
    );

    async function createRequest(token, extra = {}) {
        const result = await request("/api/v1/ride-requests", {
            method: "POST", token,
            body: { pickupZoneId: pickup.id, destinationZoneId: destination.id, requestedSeats: 1, ...extra },
        });
        return result;
    }
    const requestA = await createRequest(passengerToken);
    assert.equal(requestA.status, 201, JSON.stringify(requestA.body));
    const requestAId = requestA.body.data.id;
    created.requestIds.push(requestAId);
    assert.equal(requestA.body.data.estimatedFare, expectedFare);
    assert.equal((await createRequest(passengerToken, { requestedSeats: 0 })).status, 400);
    assert.equal((await createRequest(passengerToken, { extra: true })).status, 400);
    assert.equal((await createRequest(passengerToken, { pickupZoneId: randomUUID() })).status, 404);
    assert.equal((await createRequest(passengerToken, { pickupZoneId: "not-a-uuid" })).status, 400);
    assert.equal((await request("/api/v1/ride-requests", { method: "POST", body: { pickupZoneId: pickup.id, destinationZoneId: destination.id, requestedSeats: 1 } })).status, 401);

    const requestB = await createRequest(await login(passengerB));
    const requestC = await createRequest(await login(passengerC));
    const requestD = await createRequest(await login(passengerD));
    for (const createdRequest of [requestB, requestC, requestD]) {
        assert.equal(createdRequest.status, 201, JSON.stringify(createdRequest.body));
        created.requestIds.push(createdRequest.body.data.id);
    }

    assert.equal((await request("/api/v1/pools", { method: "POST", token: driverToken, body: {} })).status, 400);
    const poolResult = await request("/api/v1/pools", { method: "POST", token: driverToken, body: { vehicleId } });
    assert.equal(poolResult.status, 201, JSON.stringify(poolResult.body));
    const poolId = poolResult.body.data.id;
    created.poolIds.push(poolId);
    assert.equal((await request("/api/v1/pools/not-a-uuid/history", { token: driverToken })).status, 400);
    const firstAccepted = await request(`/api/v1/pools/${poolId}/members`, { method: "POST", token: driverToken, body: { rideRequestId: requestAId } });
    assert.equal(firstAccepted.status, 201, JSON.stringify(firstAccepted.body));
    assert.equal(firstAccepted.body.data.member.seatNumber, 1);
    assert.equal(firstAccepted.body.data.occupancy.occupiedSeats, 1);
    assert.equal((await request(`/api/v1/pools/${poolId}/members`, { method: "POST", token: driverToken, body: { rideRequestId: requestAId } })).status, 409);
    assert.equal((await request(`/api/v1/ride-requests/${requestB.body.data.id}`, { token: passengerToken })).status, 403);
    assert.equal((await request(`/api/v1/ride-requests/${requestB.body.data.id}/cancel`, { method: "PATCH", token: passengerToken, body: {} })).status, 403);
    assert.equal((await request(`/api/v1/pools/${poolId}/members`, { method: "POST", token: otherDriverToken, body: { rideRequestId: requestB.body.data.id } })).status, 403);
    assert.equal((await request(`/api/v1/pools/${poolId}`, { token: otherDriverToken })).status, 403);
    assert.equal((await request(`/api/v1/pools/${poolId}/members`, { method: "POST", token: passengerToken, body: { rideRequestId: requestB.body.data.id } })).status, 403);

    // Three simultaneous HTTP calls contend for the two remaining seats in PostgreSQL.
    const raceRequests = [requestB, requestC, requestD];
    const raceResults = await Promise.all(raceRequests.map((rideRequest) => request(`/api/v1/pools/${poolId}/members`, {
        method: "POST", token: driverToken, body: { rideRequestId: rideRequest.body.data.id },
    })));
    assert.equal(raceResults.filter((result) => result.status === 201).length, 2, JSON.stringify(raceResults));
    assert.equal(raceResults.filter((result) => result.status === 409).length, 1, JSON.stringify(raceResults));

    const members = await prisma.poolMember.findMany({ where: { poolId }, include: { rideRequest: true } });
    const occupiedSeats = members.reduce((sum, member) => sum + member.rideRequest.requestedSeats, 0);
    assert.equal(members.length, 3);
    assert.equal(occupiedSeats, 3);
    assert.ok(members.every((member) => member.seatNumber >= 1 && member.seatNumber <= 3));
    assert.equal(new Set(members.map((member) => member.seatNumber)).size, members.length);
    assert.equal(members.filter((member) => member.rideRequest.status === "ACCEPTED").length, 3);
    const losingRequest = raceRequests.find((rideRequest) => !members.some((member) => member.rideRequestId === rideRequest.body.data.id));
    assert.ok(losingRequest);
    const losingDbRequest = await prisma.rideRequest.findUnique({ where: { id: losingRequest.body.data.id } });
    assert.equal(losingDbRequest.status, "PENDING");
    assert.equal((await prisma.pool.findUnique({ where: { id: poolId } })).estimatedFare, expectedFare * 3);

    assert.equal((await request(`/api/v1/pools/${poolId}/start`, { method: "PATCH", token: driverToken, body: {} })).status, 409);
    assert.equal((await request(`/api/v1/pools/${poolId}/arrive`, { method: "PATCH", token: otherDriverToken, body: {} })).status, 403);
    assert.equal((await request(`/api/v1/pools/${poolId}/arrive`, { method: "PATCH", token: driverToken, body: {} })).status, 200);
    assert.equal((await request(`/api/v1/pools/${poolId}/arrive`, { method: "PATCH", token: driverToken, body: {} })).status, 409);
    assert.equal((await request(`/api/v1/pools/${poolId}/start`, { method: "PATCH", token: driverToken, body: {} })).status, 200);
    const startedPool = await prisma.pool.findUnique({ where: { id: poolId } });
    assert.equal(startedPool.status, "STARTED");
    assert.ok(startedPool.startedAt instanceof Date);
    assert.equal((await request(`/api/v1/pools/${poolId}/start`, { method: "PATCH", token: driverToken, body: {} })).status, 409);
    const cashMember = members.find((member) => member.passengerId !== passengerA.user.id);
    const teslaMember = members.find((member) => member.passengerId === passengerA.user.id);
    const startedCancellationMember = members.find((member) => member.id !== cashMember?.id && member.id !== teslaMember?.id);
    assert.ok(cashMember && teslaMember && startedCancellationMember);
    assert.equal((await request(`/api/v1/payments/pool-members/${teslaMember.id}`, { method: "POST", token: passengerToken, body: { method: "BITCOIN" } })).status, 400);
    assert.equal((await request(`/api/v1/ride-requests/${startedCancellationMember.rideRequestId}/cancel`, {
        method: "PATCH", token: passengerTokens.get(startedCancellationMember.passengerId), body: {},
    })).status, 409);
    assert.equal((await prisma.rideRequest.findUnique({ where: { id: startedCancellationMember.rideRequestId } })).status, "ACCEPTED");
    assert.equal((await prisma.poolMember.findUnique({ where: { id: startedCancellationMember.id } })).status, "PENDING");
    assert.equal(await prisma.rideHistory.count({ where: { poolId } }), 4);
    assert.equal((await request(`/api/v1/pools/${poolId}/cancel`, {
        method: "PATCH", token: driverToken, body: { reason: "cannot cancel started trip" },
    })).status, 409);
    assert.equal((await prisma.pool.findUnique({ where: { id: poolId } })).status, "STARTED");
    assert.equal((await request(`/api/v1/pools/${poolId}/cancel`, {
        method: "PATCH", token: driverToken, body: { reason: "cannot cancel started trip" },
    })).status, 409);
    assert.equal((await prisma.pool.findUnique({ where: { id: poolId } })).status, "STARTED");
    assert.equal((await request(`/api/v1/pools/${poolId}/complete`, { method: "PATCH", token: driverToken, body: {} })).status, 200);
    const completedPool = await prisma.pool.findUnique({ where: { id: poolId } });
    assert.equal(completedPool.status, "COMPLETED");
    assert.ok(completedPool.completedAt instanceof Date);
    assert.equal((await request(`/api/v1/ride-requests/${requestAId}/cancel`, { method: "PATCH", token: passengerToken, body: {} })).status, 409);

    assert.equal(cashMember.fare, expectedFare);
    const cashPaymentResult = await request(`/api/v1/payments/pool-members/${cashMember.id}`, { method: "POST", token: passengerTokens.get(cashMember.passengerId), body: { method: "CASH" } });
    assert.equal(cashPaymentResult.status, 201, JSON.stringify(cashPaymentResult.body));
    assert.equal(cashPaymentResult.body.data.status, "PENDING");
    assert.equal(cashPaymentResult.body.data.amount, cashMember.fare);
    assert.equal(cashPaymentResult.body.data.paidAt, null);
    assert.equal((await prisma.poolMember.findUnique({ where: { id: cashMember.id } })).status, "PENDING");
    const cashPaymentId = cashPaymentResult.body.data.id;
    assert.equal((await request(`/api/v1/payments/${cashPaymentId}/confirm`, { method: "PATCH", token: otherDriverToken, body: {} })).status, 403);
    const cashConfirmed = await request(`/api/v1/payments/${cashPaymentId}/confirm`, { method: "PATCH", token: driverToken, body: {} });
    assert.equal(cashConfirmed.status, 200);
    const cashDbState = await prisma.payment.findUnique({ where: { id: cashPaymentId } });
    assert.equal(cashDbState.status, "SUCCESS");
    assert.equal(cashDbState.method, "CASH");
    assert.ok(cashDbState.paidAt instanceof Date);
    assert.equal((await prisma.poolMember.findUnique({ where: { id: cashMember.id } })).status, "PAID");
    assert.equal((await request(`/api/v1/payments/${cashPaymentId}/confirm`, { method: "PATCH", token: driverToken, body: {} })).status, 409);
    assert.equal((await request(`/api/v1/payments/pool-members/${cashMember.id}`, { method: "POST", token: passengerTokens.get(cashMember.passengerId), body: { method: "CASH" } })).status, 409);

    const teslaPayment = await request(`/api/v1/payments/pool-members/${teslaMember.id}`, { method: "POST", token: passengerToken, body: { method: "TESLAPAY" } });
    assert.equal(teslaPayment.status, 201, JSON.stringify(teslaPayment.body));
    assert.equal(teslaPayment.body.data.method, "TESLAPAY");
    assert.equal(teslaPayment.body.data.status, "SUCCESS");
    assert.equal(teslaPayment.body.data.amount, teslaMember.fare);
    assert.ok(teslaPayment.body.data.paidAt);
    assert.equal((await prisma.poolMember.findUnique({ where: { id: teslaMember.id } })).status, "PAID");
    assert.equal((await request(`/api/v1/payments/pool-members/${teslaMember.id}`, { method: "POST", token: passengerToken, body: { method: "TESLAPAY" } })).status, 409);
    assert.equal(await prisma.payment.count({ where: { poolMemberId: teslaMember.id, status: { in: ["PENDING", "SUCCESS"] } } }), 1);

    const historyResponse = await request(`/api/v1/pools/${poolId}/history`, { token: driverToken });
    assert.equal(historyResponse.status, 200);
    assert.deepEqual(historyResponse.body.data.history.map((event) => event.eventType), ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED", "COMPLETED"]);
    assert.ok(historyResponse.body.data.history.every((event) => event.createdAt));
    assert.equal((await request(`/api/v1/pools/${poolId}/history`, { token: passengerTokens.get(unrelatedPassenger.user.id) })).status, 403);
    const passengerHistory = await request("/api/v1/ride-requests/history", { token: passengerToken });
    assert.equal(passengerHistory.status, 200);
    const ownHistoryItem = passengerHistory.body.data.find((item) => item.id === requestAId);
    assert.equal(ownHistoryItem.status, "ACCEPTED");
    assert.equal(ownHistoryItem.poolMember.fare, expectedFare);
    assert.equal(ownHistoryItem.poolMember.pool.status, "COMPLETED");
    const driverHistory = await request("/api/v1/driver/ride-history", { token: driverToken });
    assert.equal(driverHistory.status, 200);
    assert.ok(driverHistory.body.data.some((pool) => pool.id === poolId));

    // Separate pre-start passenger cancellation, followed by driver pool cancellation.
    const cancelVehicle = await request("/api/v1/vehicles", { method: "POST", token: driverToken, body: { model: "Cancel Tesla", plateNumber: `CAN-${tag}` } });
    assert.equal(cancelVehicle.status, 201, JSON.stringify(cancelVehicle.body));
    created.vehicleIds.push(cancelVehicle.body.data.id);
    await request(`/api/v1/vehicles/${cancelVehicle.body.data.id}/status`, { method: "PATCH", token: driverToken, body: { status: "ONLINE" } });
    const cancellationRequest = await createRequest(await login(passengerD));
    assert.equal(cancellationRequest.status, 201);
    created.requestIds.push(cancellationRequest.body.data.id);
    const cancellationPoolResult = await request("/api/v1/pools", { method: "POST", token: driverToken, body: { vehicleId: cancelVehicle.body.data.id } });
    assert.equal(cancellationPoolResult.status, 201);
    const cancellationPoolId = cancellationPoolResult.body.data.id;
    created.poolIds.push(cancellationPoolId);
    const cancelledMemberResult = await request(`/api/v1/pools/${cancellationPoolId}/members`, { method: "POST", token: driverToken, body: { rideRequestId: cancellationRequest.body.data.id } });
    assert.equal(cancelledMemberResult.status, 201);
    const cancellationMemberId = cancelledMemberResult.body.data.member.id;
    assert.equal((await request(`/api/v1/ride-requests/${cancellationRequest.body.data.id}/cancel`, { method: "PATCH", token: await login(passengerD), body: {} })).status, 200);
    const cancelledRequestDb = await prisma.rideRequest.findUnique({ where: { id: cancellationRequest.body.data.id } });
    const cancelledMemberDb = await prisma.poolMember.findUnique({ where: { id: cancellationMemberId } });
    assert.equal(cancelledRequestDb.status, "CANCELLED");
    assert.equal(cancelledMemberDb.status, "CANCELLED");
    assert.ok(cancelledMemberDb.leftAt instanceof Date);
    assert.equal((await prisma.pool.findUnique({ where: { id: cancellationPoolId } })).estimatedFare, 0);
    assert.equal((await request(`/api/v1/payments/pool-members/${cancellationMemberId}`, { method: "POST", token: await login(passengerD), body: { method: "TESLAPAY" } })).status, 409);
    assert.equal(await prisma.payment.count({ where: { poolMemberId: cancellationMemberId } }), 0);
    assert.equal((await request(`/api/v1/ride-requests/${cancellationRequest.body.data.id}/cancel`, { method: "PATCH", token: await login(passengerD), body: {} })).status, 409);
    const noFalseCancellationEvent = await prisma.rideHistory.findMany({ where: { poolId: cancellationPoolId }, orderBy: { createdAt: "asc" } });
    assert.deepEqual(noFalseCancellationEvent.map((event) => event.eventType), ["REQUESTED", "MATCHED"]);

    const finalRequest = await createRequest(await login(passengerC));
    assert.equal(finalRequest.status, 201);
    created.requestIds.push(finalRequest.body.data.id);
    const finalMember = await request(`/api/v1/pools/${cancellationPoolId}/members`, { method: "POST", token: driverToken, body: { rideRequestId: finalRequest.body.data.id } });
    assert.equal(finalMember.status, 201);
    assert.equal((await request(`/api/v1/pools/${cancellationPoolId}/cancel`, { method: "PATCH", token: otherDriverToken, body: { reason: "wrong owner" } })).status, 403);
    assert.equal((await request(`/api/v1/pools/${cancellationPoolId}/cancel`, { method: "PATCH", token: driverToken, body: { reason: "  !!! " } })).status, 400);
    assert.equal((await request(`/api/v1/pools/${cancellationPoolId}/cancel`, { method: "PATCH", token: driverToken, body: { reason: "x".repeat(501) } })).status, 400);
    const poolCancelled = await request(`/api/v1/pools/${cancellationPoolId}/cancel`, { method: "PATCH", token: driverToken, body: { reason: "Phase 5 regression cleanup scenario" } });
    assert.equal(poolCancelled.status, 200, JSON.stringify(poolCancelled.body));
    assert.equal((await prisma.pool.findUnique({ where: { id: cancellationPoolId } })).status, "CANCELLED");
    assert.equal((await prisma.rideRequest.findUnique({ where: { id: finalRequest.body.data.id } })).status, "CANCELLED");
    assert.equal((await prisma.poolMember.findUnique({ where: { id: finalMember.body.data.member.id } })).status, "CANCELLED");
    const cancelledTimeline = await prisma.rideHistory.findMany({ where: { poolId: cancellationPoolId }, orderBy: { createdAt: "asc" } });
    assert.deepEqual(cancelledTimeline.map((event) => event.eventType), ["REQUESTED", "MATCHED", "CANCELLED"]);
    assert.equal((await request(`/api/v1/pools/${cancellationPoolId}/cancel`, { method: "PATCH", token: driverToken, body: { reason: "repeat" } })).status, 409);
});
