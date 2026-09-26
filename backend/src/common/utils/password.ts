import type { BinaryLike, ScryptOptions } from "node:crypto";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scryptCallback) as (
    password: BinaryLike,
    salt: BinaryLike,
    keylen: number,
    options?: ScryptOptions,
) => Promise<Buffer>;

const SCRYPT_PARAMS = {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
} as const;

const KEY_LEN = 64;
const SALT_LEN = 16;

/**
 * Hashes a plaintext password using Node.js crypto scrypt with a fresh random salt.
 * Returns a self-contained string formatted as `$scrypt$N=16384,r=8,p=1$saltHex$hashHex`.
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LEN);
    const derivedKey = await scryptAsync(password, salt, KEY_LEN, SCRYPT_PARAMS);

    const saltHex = salt.toString("hex");
    const hashHex = derivedKey.toString("hex");

    return `$scrypt$N=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}$${saltHex}$${hashHex}`;
}

/**
 * Compares a plaintext password against a stored scrypt password hash in constant time.
 */
export async function comparePassword(password: string, passwordHash: string): Promise<boolean> {
    const parts = passwordHash.split("$");
    if (parts.length !== 5 || parts[1] !== "scrypt") {
        return false;
    }

    const paramsStr = parts[2];
    const saltHex = parts[3];
    const storedHashHex = parts[4];

    if (!paramsStr || !saltHex || !storedHashHex) {
        return false;
    }

    const options: { N?: number; r?: number; p?: number; maxmem: number } = {
        maxmem: SCRYPT_PARAMS.maxmem,
    };

    const paramPairs = paramsStr.split(",");
    for (const pair of paramPairs) {
        const [key, val] = pair.split("=");
        if (key === undefined || val === undefined) {
            continue;
        }
        const num = parseInt(val, 10);
        if (Number.isNaN(num)) {
            return false;
        }

        if (key === "N") options.N = num;
        else if (key === "r") options.r = num;
        else if (key === "p") options.p = num;
    }

    if (!options.N || !options.r || !options.p) {
        return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const storedHash = Buffer.from(storedHashHex, "hex");

    const derivedKey = await scryptAsync(password, salt, storedHash.length, options);

    if (derivedKey.length !== storedHash.length) {
        return false;
    }

    return timingSafeEqual(derivedKey, storedHash);
}
