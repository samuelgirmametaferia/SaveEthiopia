import crypto from 'crypto';
import { client } from './db';
import environmentConfig from '../config.js';

const log = environmentConfig.log;

//Session token length is 32
export function generateSessionToken(length = 32) {
    const randomBytes = crypto.randomBytes(length);
    const token = randomBytes.toString('hex');
    return token;
}

export async function recordSession(userId, sessionToken) {
    const { data, error } = await client
        .from('sessions')
        .insert(
            [
                {
                    user_id: userId,
                    session_token: sessionToken
                }
            ]
        );

    if (error) {
        // Foreign key violation in Supabase/PostgreSQL usually has code '23503'
        if (error.code === '23503') {
            return { success: false, code: 'USER_NOT_FOUND', message: 'User ID does not exist' };
        }
        return { success: false, code: 'INSERT_FAILED', message: error.message };
    }

    return { success: true, data };

}

export async function getSessionByUserId(user_id) {
    const { data, error } = await client
        .from('sessions')
        .select("*")
        .eq('user_id', user_id)
        .limit(1)
    if (error) {
        if(log) console.error('Error fetching session:', error);
        return null;
    }

    return data[0] || null; 
}

export async function clearSessions(user_id) {
    try {
        const { data, error } = await client
            .from('sessions')
            .delete()
            .eq('user_id', user_id);

        if (error) {
            if(log) console.error(`Failed to delete sessions for user_id=${user_id}:`, error);
            throw new Error(`Database error: ${error.message}`);
        }

        if(log) console.log(`Deleted ${data.length} session(s) for user_id=${user_id}`);
        return data.length; 
    } catch (err) {
        if(log) console.error(`Unexpected error while deleting sessions for user_id=${user_id}:`, err);
        throw err; 
    }
}
