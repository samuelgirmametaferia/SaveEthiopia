
import client from './db.js';
import { generateSessionToken, recordSession, clearSessions } from './sessions.js';
import environmentConfig from '../config.js';

const log = environmentConfig.log;


async function createUser(insert_email) {
    try {
        if(log) console.log(`[createUser] Attempting to insert user: ${insert_email}`);

        const { data, error } = await client
            .from("userData")
            .insert([{ email: insert_email }]);

        if (error) {
            if(log) console.error(`[createUser] Error inserting user:`, error);
            throw new Error(`Database insertion failed: ${error.message}`);
        }

        if (!data || data.length === 0) {
            if(log) console.error(`[createUser] No user data returned after insert`);
            throw new Error("No user data returned from database.");
        }

        const userId = data[0].user_id;
        const session_token = generateSessionToken();

        if(log) console.log(`[createUser] Generated session token for user_id ${userId}`);

        try {
            await recordSession(userId, session_token);
            if(log) console.log(`[createUser] Session recorded successfully for user_id ${userId}`);
        } catch (sessionError) {
            if(log) console.error(`[createUser] Failed to record session for user_id ${userId}:`, sessionError);
            throw new Error("Failed to record user session.");
        }

        return session_token;

    } catch (err) {
        if(log) console.error(`[createUser] Failed to create user:`, err);

        return { success: false, message: err.message };
    }
}


export async function loginUser(insert_email) {
    try {
        const { data, error } = await client
            .from('userData')
            .select('*')
            .eq('email', insert_email)
            .limit(1);

        if (error) {
            if(log) console.error(`Database error while fetching user:`, error);
            throw new Error(`Database error: ${error.message}`);
        }

        if (!data || data.length === 0) {
            if(log) console.warn(`No user found with email: ${insert_email}`);
            throw new Error('User not found');
        }

        const user = data[0];

        // Clear previous sessions
        const cleared = await clearSessions(user.user_id);
        if(log) console.log(`Cleared ${cleared} previous session(s) for user_id=${user.user_id}`);

        // Generate new session token
        const session_token = generateSessionToken();

        // Record the new session
        await recordSession(user.user_id, session_token);
        if(log) console.log(`New session recorded for user_id=${user.user_id}`);

        return session_token;
    } catch (err) {
        if(log) console.error(`Error logging in user with email=${insert_email}:`, err);
        throw err; // propagate the error
    }
}
