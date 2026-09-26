import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const ALGORITHM = "HS256";
const ISSUER = "dhaka-tesla-pool-api";
const AUDIENCE = "dhaka-tesla-pool-client";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
    sub: string;
    role: UserRole;
    tokenType: "access";
}

export interface RefreshTokenPayload {
    sub: string;
    tokenType: "refresh";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSecretKey(secret: string): Uint8Array {
    return new TextEncoder().encode(secret);
}

// ─── Signing ─────────────────────────────────────────────────────────────────

export async function signAccessToken(payload: Omit<AccessTokenPayload, "tokenType">): Promise<string> {
    return new SignJWT({ role: payload.role, tokenType: "access" })
        .setProtectedHeader({ alg: ALGORITHM })
        .setSubject(payload.sub)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_TTL)
        .sign(toSecretKey(env.JWT_ACCESS_SECRET));
}

export async function signRefreshToken(payload: Omit<RefreshTokenPayload, "tokenType">): Promise<string> {
    return new SignJWT({ tokenType: "refresh" })
        .setProtectedHeader({ alg: ALGORITHM })
        .setSubject(payload.sub)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_TTL)
        .sign(toSecretKey(env.JWT_REFRESH_SECRET));
}

// ─── Verification ─────────────────────────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, toSecretKey(env.JWT_ACCESS_SECRET), {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
    });

    const role = payload["role"];

    if (
        typeof payload.sub !== "string" ||
        typeof role !== "string" ||
        !Object.values(UserRole).includes(role as UserRole) ||
        payload["tokenType"] !== "access"
    ) {
        throw new Error("Invalid access token payload");
    }

    return {
        sub: payload.sub,
        role: role as UserRole,
        tokenType: "access",
    };
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const { payload } = await jwtVerify(token, toSecretKey(env.JWT_REFRESH_SECRET), {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
    });

    if (
        typeof payload.sub !== "string" ||
        payload["tokenType"] !== "refresh"
    ) {
        throw new Error("Invalid refresh token payload");
    }

    return {
        sub: payload.sub,
        tokenType: "refresh",
    };
}
