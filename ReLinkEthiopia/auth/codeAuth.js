import { environmentConfig } from "../config";
import generateVerificationCode from 'generate-verification-code';
import Redis from 'ioredis';

const log = environmentConfig.log;
const redis = new Redis();

export async function createVerificationCode(user_id, ttlSeconds = 600) {
    try {
        const code = generateVerificationCode.generateVerificationCode();
        await redis.set(`login_code:${user_id}`, code, 'EX', ttlSeconds);
        if (log) console.log(`Verification code created for user ${user_id}: ${code}`);
        return code;
    } catch (error) {
        if (log) console.error(`Error creating verification code for user ${user_id}:`, error);
        throw new Error('Failed to create verification code.');
    }
}

export async function validateLoginCode(user_id, submittedCode) {
    try {
        const code = await redis.get(`login_code:${user_id}`);
        if (!code) {
            if (log) console.warn(`No verification code found for user ${user_id}`);
            return false;
        }

        if (code === submittedCode) {
            await redis.del(`login_code:${user_id}`);
            if (log) console.log(`Verification code validated for user ${user_id}`);
            return true;
        } else {
            if (log) console.warn(`Invalid verification code attempt for user ${user_id}`);
            return false;
        }
    } catch (error) {
        if (log) console.error(`Error validating verification code for user ${user_id}:`, error);
        return false;
    }
}
