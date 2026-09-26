import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

// Throws 403 if the authenticated user is not the resource owner.
export function assertOwnership(resourceOwnerId: string, authenticatedUserId: string): void {
    if (resourceOwnerId !== authenticatedUserId) {
        throw new AppError("Insufficient permissions", 403, ERROR_CODES.FORBIDDEN);
    }
}

