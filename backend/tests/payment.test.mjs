import assert from "node:assert/strict";
import { once } from "node:events";
import { after, afterEach, before, mock, test } from "node:test";
import { app } from "../dist/app.js";
import { signAccessToken } from "../dist/common/utils/jwt.js";
import { PaymentMethod, PaymentStatus, PoolMemberStatus, PoolStatus, UserRole } from "../dist/generated/prisma/client.js";
import { createPaymentService, paymentService } from "../dist/modules/payment/payment.service.js";

const ids = {
    passenger: "11111111-1111-4111-8111-111111111111",
    otherPassenger: "22222222-2222-4222-8222-222222222222",
    driver: "33333333-3333-4333-8333-333333333333",
    otherDriver: "44444444-4444-4444-8444-444444444444",
    member: "55555555-5555-4555-8555-555555555555",
    payment: "66666666-6666-4666-8666-666666666666",
    pool: "77777777-7777-4777-8777-777777777777",
};

let server;
let origin;
let tokens;

before(async () => {
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    origin = "http://127.0.0.1:" + server.address().port;
    tokens = {
        passenger: await signAccessToken({ sub: ids.passenger, role: UserRole.PASSENGER }),
        otherPassenger: await signAccessToken({ sub: ids.otherPassenger, role: UserRole.PASSENGER }),
        driver: await signAccessToken({ sub: ids.driver, role: UserRole.DRIVER }),
        otherDriver: await signAccessToken({ sub: ids.otherDriver, role: UserRole.DRIVER }),
    };
});
afterEach(() => mock.restoreAll());
after(async () => {
    if (server) {
        server.close();
        await once(server, "close");
    }
});

function harness(overrides = {}) {
    let transactionQueue = Promise.resolve();
    let lastQuery;
    const state = {
        member: {
            id: ids.member,
            passengerId: ids.passenger,
            fare: 12345,
            memberStatus: PoolMemberStatus.PENDING,
            poolStatus: PoolStatus.COMPLETED,
        },
        payment: {
            id: ids.payment,
            method: PaymentMethod.CASH,
            status: PaymentStatus.PENDING,
            poolMemberId: ids.member,
            memberStatus: PoolMemberStatus.PENDING,
            driverId: ids.driver,
        },
        payments: [],
        createdData: undefined,
        ...overrides,
    };
    const tx = {
        payment: {
            findFirst: async () => state.payments.find((item) =>
                [PaymentStatus.PENDING, PaymentStatus.SUCCESS].includes(item.status),
            ) ?? null,
            create: async ({ data }) => {
                state.createdData = data;
                const created = { id: ids.payment, ...data };
                state.payments.push(created);
                state.payment = { ...state.payment, ...created };
                return created;
            },
            updateMany: async ({ where, data }) => {
                if (!state.payment || state.payment.id !== where.id || state.payment.status !== where.status) return { count: 0 };
                Object.assign(state.payment, data);
                return { count: 1 };
            },
            findUniqueOrThrow: async () => state.payment,
            findUnique: async () => state.payment ? { id: state.payment.id } : null,
        },
        poolMember: {
            findUnique: async () => state.member ? { id: state.member.id } : null,
            updateMany: async ({ where, data }) => {
                if (!state.member || state.member.id !== where.id || state.member.memberStatus !== where.status) return { count: 0 };
                state.member.memberStatus = data.status;
                if (state.payment) state.payment.memberStatus = data.status;
                return { count: 1 };
            },
        },
    };
    const database = {
        $transaction: async (callback) => {
        let unlock;
        const txForCall = {
            ...tx,
            $queryRaw: async (query) => {
                lastQuery = query;
                const previous = transactionQueue;
                transactionQueue = new Promise((resolve) => { unlock = resolve; });
                await previous;
                const scopedUserId = query.values?.[1];
                if (state.queryMode === "confirm") {
                    return state.payment?.driverId === scopedUserId ? [state.payment] : [];
                }
                return state.member?.passengerId === scopedUserId ? [state.member] : [];
            },
        };
        try {
            return await callback(txForCall);
        } finally {
            unlock?.();
        }
        },
    };
    const service = createPaymentService(database);
    state.lastQuery = () => lastQuery;
    return { state, service };
}

function isConflict(error) {
    return error?.statusCode === 409 && error?.code === "CONFLICT";
}
function isForbidden(error) {
    return error?.statusCode === 403 && error?.code === "FORBIDDEN";
}

test("service unit: passenger can create TeslaPay payment for their own completed member", async () => {
    const { state, service } = harness();
    const payment = await service.createForPassenger(ids.passenger, ids.member, PaymentMethod.TESLAPAY);
    assert.equal(payment.poolMemberId, ids.member);
    assert.equal(state.member.memberStatus, PoolMemberStatus.PAID);
});

test("service unit: amount comes from PoolMember.fare and TeslaPay succeeds immediately", async () => {
    const { state, service } = harness();
    const payment = await service.createForPassenger(ids.passenger, ids.member, PaymentMethod.TESLAPAY);
    assert.equal(payment.amount, 12345);
    assert.equal(payment.status, PaymentStatus.SUCCESS);
    assert.ok(payment.paidAt instanceof Date);
    assert.match(payment.transactionRef, /^MOCK-TESLAPAY-/);
    assert.equal(state.member.memberStatus, PoolMemberStatus.PAID);
});

test("service unit: CASH payment remains pending and does not mark the member paid", async () => {
    const { state, service } = harness();
    const payment = await service.createForPassenger(ids.passenger, ids.member, PaymentMethod.CASH);
    assert.equal(payment.amount, 12345);
    assert.equal(payment.status, PaymentStatus.PENDING);
    assert.equal(payment.paidAt, null);
    assert.equal(state.member.memberStatus, PoolMemberStatus.PENDING);
});

test("service unit: pool-member ownership is enforced", async () => {
    const { service } = harness();
    await assert.rejects(
        service.createForPassenger(ids.otherPassenger, ids.member, PaymentMethod.CASH),
        isForbidden,
    );
});

test("service unit: payment is rejected before the pool is completed", async () => {
    const { service } = harness({ member: { ...defaultMember(), poolStatus: PoolStatus.STARTED } });
    await assert.rejects(
        service.createForPassenger(ids.passenger, ids.member, PaymentMethod.CASH),
        isConflict,
    );
});

function defaultMember() {
    return {
        id: ids.member,
        passengerId: ids.passenger,
        fare: 12345,
        memberStatus: PoolMemberStatus.PENDING,
        poolStatus: PoolStatus.COMPLETED,
    };
}

test("service unit: cancelled members cannot be charged", async () => {
    const { service } = harness({ member: { ...defaultMember(), memberStatus: PoolMemberStatus.CANCELLED } });
    await assert.rejects(
        service.createForPassenger(ids.passenger, ids.member, PaymentMethod.CASH),
        isConflict,
    );
});

for (const existingStatus of [PaymentStatus.PENDING, PaymentStatus.SUCCESS]) {
    test(`service unit: a second ${existingStatus} payment is rejected`, async () => {
        const { service } = harness({ payments: [{ id: ids.payment, status: existingStatus }] });
        await assert.rejects(
            service.createForPassenger(ids.passenger, ids.member, PaymentMethod.CASH),
            isConflict,
        );
    });
}

test("service unit: driver confirms own pending cash payment and member becomes paid", async () => {
    const { state, service } = harness({ queryMode: "confirm" });
    const payment = await service.confirmCash(ids.driver, ids.payment);
    assert.equal(payment.status, PaymentStatus.SUCCESS);
    assert.ok(payment.paidAt instanceof Date);
    assert.equal(state.member.memberStatus, PoolMemberStatus.PAID);
});

test("service unit: another driver's pool payment cannot be confirmed", async () => {
    const { service } = harness({ queryMode: "confirm", payment: { ...defaultPayment(), driverId: ids.otherDriver } });
    await assert.rejects(service.confirmCash(ids.driver, ids.payment), isForbidden);
});

function defaultPayment() {
    return {
        id: ids.payment,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
        poolMemberId: ids.member,
        memberStatus: PoolMemberStatus.PENDING,
        driverId: ids.driver,
    };
}

test("service unit: concurrent cash payment attempts serialize and only one stays outstanding", async () => {
    const { state, service } = harness();
    const results = await Promise.allSettled([
        service.createForPassenger(ids.passenger, ids.member, PaymentMethod.CASH),
        service.createForPassenger(ids.passenger, ids.member, PaymentMethod.CASH),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected" && isConflict(result.reason)).length, 1);
    assert.equal(state.payments.length, 1);
    assert.match(state.lastQuery().sql, /FOR UPDATE OF pm/);
});

test("service unit: repeated cash confirmation is rejected", async () => {
    const { state, service } = harness({ queryMode: "confirm" });
    await service.confirmCash(ids.driver, ids.payment);
    state.payment.status = PaymentStatus.SUCCESS;
    await assert.rejects(service.confirmCash(ids.driver, ids.payment), isConflict);
});

test("HTTP/auth: passenger cannot call the driver cash-confirmation endpoint", async () => {
    let called = false;
    mock.method(paymentService, "confirmCash", async () => { called = true; return {}; });
    const response = await fetch(`${origin}/api/v1/payments/${ids.payment}/confirm`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${tokens.passenger}`, "content-type": "application/json" },
        body: "{}",
    });
    assert.equal(response.status, 403);
    assert.equal(called, false);
});

test("HTTP/route: payment input rejects client-supplied amount", async () => {
    let called = false;
    mock.method(paymentService, "createForPassenger", async () => { called = true; return {}; });
    const response = await fetch(`${origin}/api/v1/payments/pool-members/${ids.member}`, {
        method: "POST",
        headers: { authorization: `Bearer ${tokens.passenger}`, "content-type": "application/json" },
        body: JSON.stringify({ method: "TESLAPAY", amount: 1 }),
    });
    assert.equal(response.status, 400);
    assert.equal(called, false);
});
