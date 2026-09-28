import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { prisma } from "../../config/database.js";
import {
    PaymentMethod,
    PaymentStatus,
    PoolMemberStatus,
    PoolStatus,
    Prisma,
} from "../../generated/prisma/client.js";

type LockedPoolMember = {
    id: string;
    passengerId: string;
    fare: number;
    memberStatus: PoolMemberStatus;
    poolStatus: PoolStatus;
};

type LockedPayment = {
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    poolMemberId: string;
    memberStatus: PoolMemberStatus;
    driverId: string;
};

function transactionReference(method: PaymentMethod): string {
    return `MOCK-${method}-${randomUUID()}`;
}

export function createPaymentService(database: typeof prisma = prisma) {
    return {
        async createForPassenger(passengerId: string, poolMemberId: string, method: PaymentMethod) {
            return database.$transaction(async (tx) => {
                const rows = await tx.$queryRaw<LockedPoolMember[]>(Prisma.sql`
                    SELECT pm.id::text AS id,
                           pm.passenger_id::text AS "passengerId",
                           pm.fare,
                           pm.status AS "memberStatus",
                           p.status AS "poolStatus"
                    FROM pool_members AS pm
                    JOIN pools AS p ON p.id = pm.pool_id
                    WHERE pm.id = ${poolMemberId}::uuid
                      AND pm.passenger_id = ${passengerId}::uuid
                    FOR UPDATE OF pm
                `);
                const member = rows[0];
                if (!member) {
                    const existingMember = await tx.poolMember.findUnique({
                        where: { id: poolMemberId },
                        select: { id: true },
                    });
                    if (!existingMember) {
                        throw new AppError("Pool member not found", 404, ERROR_CODES.NOT_FOUND);
                    }
                    throw new AppError("Insufficient permissions", 403, ERROR_CODES.FORBIDDEN);
                }
                if (member.memberStatus === PoolMemberStatus.CANCELLED) {
                    throw new AppError(
                        "Cancelled pool members cannot be charged",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }
                if (member.memberStatus !== PoolMemberStatus.PENDING) {
                    throw new AppError("Pool member has already been paid", 409, ERROR_CODES.CONFLICT);
                }
                if (member.poolStatus !== PoolStatus.COMPLETED) {
                    throw new AppError(
                        "Payment is available after the pool is completed",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }

                const existingPayment = await tx.payment.findFirst({
                    where: {
                        poolMemberId: member.id,
                        status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCESS] },
                    },
                    select: { id: true },
                });
                if (existingPayment) {
                    throw new AppError(
                        "A pending or successful payment already exists",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }
                const paidAt = method === PaymentMethod.TESLAPAY ? new Date() : null;
                const payment = await tx.payment.create({
                    data: {
                        poolMemberId: member.id,
                        amount: member.fare,
                        method,
                        status: method === PaymentMethod.TESLAPAY
                            ? PaymentStatus.SUCCESS
                            : PaymentStatus.PENDING,
                        transactionRef: transactionReference(method),
                        paidAt,
                    },
                });

                if (method === PaymentMethod.TESLAPAY) {
                    const updatedMember = await tx.poolMember.updateMany({
                        where: { id: member.id, status: PoolMemberStatus.PENDING },
                        data: { status: PoolMemberStatus.PAID },
                    });
                    if (updatedMember.count !== 1) {
                        throw new AppError(
                            "Pool member status changed; retry payment",
                            409,
                            ERROR_CODES.CONFLICT,
                        );
                    }
                }

                return payment;
            });
        },

    async confirmCash(driverId: string, paymentId: string) {
        return database.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<LockedPayment[]>(Prisma.sql`
                SELECT pay.id::text AS id,
                       pay.method,
                       pay.status,
                       pay.pool_member_id::text AS "poolMemberId",
                       pm.status AS "memberStatus",
                       p.driver_id::text AS "driverId"
                FROM payments AS pay
                JOIN pool_members AS pm ON pm.id = pay.pool_member_id
                JOIN pools AS p ON p.id = pm.pool_id
                WHERE pay.id = ${paymentId}::uuid
                  AND p.driver_id = ${driverId}::uuid
                FOR UPDATE OF pay, pm
            `);
            const payment = rows[0];
            if (!payment) {
                const existingPayment = await tx.payment.findUnique({
                    where: { id: paymentId },
                    select: { id: true },
                });
                if (!existingPayment) {
                    throw new AppError("Payment not found", 404, ERROR_CODES.NOT_FOUND);
                }
                throw new AppError("Insufficient permissions", 403, ERROR_CODES.FORBIDDEN);
            }
            if (payment.method !== PaymentMethod.CASH) {
                throw new AppError("Only cash payments can be confirmed", 409, ERROR_CODES.CONFLICT);
            }
            if (payment.status !== PaymentStatus.PENDING || payment.memberStatus !== PoolMemberStatus.PENDING) {
                throw new AppError("Cash payment is no longer pending", 409, ERROR_CODES.CONFLICT);
            }

            const paidAt = new Date();
            const updatedPayment = await tx.payment.updateMany({
                where: { id: payment.id, method: PaymentMethod.CASH, status: PaymentStatus.PENDING },
                data: { status: PaymentStatus.SUCCESS, paidAt },
            });
            if (updatedPayment.count !== 1) {
                throw new AppError("Cash payment is no longer pending", 409, ERROR_CODES.CONFLICT);
            }

            const updatedMember = await tx.poolMember.updateMany({
                where: { id: payment.poolMemberId, status: PoolMemberStatus.PENDING },
                data: { status: PoolMemberStatus.PAID },
            });
            if (updatedMember.count !== 1) {
                throw new AppError("Pool member status changed; cash confirmation was not applied", 409, ERROR_CODES.CONFLICT);
            }

            return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
        });
    },

    async getMyPayments(passengerId: string) {
        return database.payment.findMany({
            where: { poolMember: { passengerId } },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                poolMemberId: true,
                amount: true,
                method: true,
                status: true,
                transactionRef: true,
                paidAt: true,
                createdAt: true,
                poolMember: {
                    select: {
                        fare: true,
                        status: true,
                        pool: { select: { id: true, status: true } },
                    },
                },
            },
        });
    },

    async getPoolPayments(driverId: string, poolId: string) {
        const pool = await database.pool.findFirst({
            where: { id: poolId, driverId },
            select: { id: true },
        });
        if (!pool) {
            const existingPool = await database.pool.findUnique({
                where: { id: poolId },
                select: { id: true },
            });
            if (!existingPool) {
                throw new AppError("Pool not found", 404, ERROR_CODES.NOT_FOUND);
            }
            throw new AppError("Insufficient permissions", 403, ERROR_CODES.FORBIDDEN);
        }
        return database.payment.findMany({
            where: { poolMember: { poolId, pool: { driverId } } },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                amount: true,
                method: true,
                status: true,
                transactionRef: true,
                paidAt: true,
                createdAt: true,
                poolMember: {
                    select: {
                        id: true,
                        passengerId: true,
                        fare: true,
                        status: true,
                    },
                },
            },
        });
    },
    };
}

export const paymentService = createPaymentService();
