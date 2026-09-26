import type { User } from "../../generated/prisma/client.js";
import { Prisma, UserRole, UserStatus, DriverApplicationStatus } from "../../generated/prisma/client.js";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { comparePassword, hashPassword } from "../../common/utils/password.js";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "../../common/utils/jwt.js";
import { prisma } from "../../config/database.js";
import type { LoginInput, RegisterInput, RefreshTokenInput, DriverApplicationInput } from "./auth.validation.js";

export interface SafeUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface LoginResult {
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
}

export interface RefreshResult {
    accessToken: string;
}

export function sanitizeUser(user: User): SafeUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

export const authService = {
    async register(input: RegisterInput): Promise<SafeUser> {
        const normalizedEmail = input.email.trim().toLowerCase();

        // 1. Check duplicate email
        const existingEmailUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingEmailUser) {
            throw new AppError("Email is already registered", 409, ERROR_CODES.CONFLICT);
        }

        // 2. Check duplicate phone if provided
        const phone = input.phone && input.phone.trim().length > 0 ? input.phone.trim() : null;

        if (phone) {
            const existingPhoneUser = await prisma.user.findUnique({
                where: { phone },
            });

            if (existingPhoneUser) {
                throw new AppError("Phone number is already registered", 409, ERROR_CODES.CONFLICT);
            }
        }

        // 3. Hash password
        const passwordHash = await hashPassword(input.password);

        // 4. Create User in database
        try {
            const user = await prisma.user.create({
                data: {
                    name: input.name.trim(),
                    email: normalizedEmail,
                    phone,
                    passwordHash,
                    role: UserRole.PASSENGER,
                    status: UserStatus.ACTIVE,
                },
            });

            return sanitizeUser(user);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                const target = error.meta?.target;
                const targetStr = Array.isArray(target) ? target.join(",") : String(target ?? "");
                const fieldName = targetStr.includes("phone") ? "Phone number" : "Email";
                throw new AppError(`${fieldName} is already registered`, 409, ERROR_CODES.CONFLICT);
            }

            throw error;
        }
    },

    async login(input: LoginInput): Promise<LoginResult> {
        const normalizedEmail = input.email.trim().toLowerCase();

        // 1. Look up user by normalized email
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        // 2. Generic credential failure — do not reveal whether account exists
        if (!user) {
            throw new AppError("Invalid email or password", 401, ERROR_CODES.UNAUTHORIZED);
        }

        // 3. Verify password using constant-time comparison
        const passwordMatch = await comparePassword(input.password, user.passwordHash);
        if (!passwordMatch) {
            throw new AppError("Invalid email or password", 401, ERROR_CODES.UNAUTHORIZED);
        }

        // 4. Check account status only after credentials are confirmed
        if (user.status !== UserStatus.ACTIVE) {
            throw new AppError("Account is inactive", 401, ERROR_CODES.UNAUTHORIZED);
        }

        const accessToken = await signAccessToken({ sub: user.id, role: user.role });
        const refreshToken = await signRefreshToken({ sub: user.id });

        return {
            user: sanitizeUser(user),
            accessToken,
            refreshToken,
        };
    },

    async refreshAccessToken(input: RefreshTokenInput): Promise<RefreshResult> {
        let payload;
        try {
            payload = await verifyRefreshToken(input.refreshToken);
        } catch {
            throw new AppError("Invalid or expired refresh token", 401, ERROR_CODES.UNAUTHORIZED);
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new AppError("Invalid or expired refresh token", 401, ERROR_CODES.UNAUTHORIZED);
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new AppError("Invalid or expired refresh token", 401, ERROR_CODES.UNAUTHORIZED);
        }

        const accessToken = await signAccessToken({ sub: user.id, role: user.role });

        return { accessToken };
    },

    async me(userId: string): Promise<SafeUser> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError("User not found", 401, ERROR_CODES.UNAUTHORIZED);
        }

        return sanitizeUser(user);
    },

    async applyForDriver(userId: string, input: DriverApplicationInput): Promise<SafeUser> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { driverApplication: true },
        });

        if (!user) {
            throw new AppError("User not found", 401, ERROR_CODES.UNAUTHORIZED);
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new AppError("User account is inactive", 403, ERROR_CODES.FORBIDDEN);
        }

        if (user.role === UserRole.DRIVER || user.driverApplication) {
            throw new AppError("User already has a driver application or is already a driver", 409, ERROR_CODES.CONFLICT);
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            await tx.driverApplication.create({
                data: {
                    userId,
                    licenseNumber: input.licenseNumber,
                    vehicleModel: input.vehicleModel,
                    vehiclePlateNumber: input.vehiclePlateNumber,
                    status: DriverApplicationStatus.APPROVED,
                    reviewedAt: new Date(),
                },
            });

            return tx.user.update({
                where: { id: userId },
                data: { role: UserRole.DRIVER },
            });
        });

        return sanitizeUser(updatedUser);
    },
};
