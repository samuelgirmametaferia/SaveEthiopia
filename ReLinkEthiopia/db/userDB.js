
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

        return {session_token,userId};

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
        const uid = user.user_id;
        // Clear previous sessions
        const cleared = await clearSessions(uid);
        if(log) console.log(`Cleared ${cleared} previous session(s) for user_id=${user.user_id}`);

        
        // Generate new session token
        const session_token = generateSessionToken();

        // Record the new session
        await recordSession(user.user_id, session_token);
        if(log) console.log(`New session recorded for user_id=${user.user_id}`);

        return {session_token,uid};
    } catch (err) {
        if(log) console.error(`Error logging in user with email=${insert_email}:`, err);
        throw err; // propagate the error
    }
}

//Change user settings


async function adjustUser({ userId, name, userAvatar, preference, miscellaneous_data }) {
    if (!userId) {
        throw new Error("userId is required to adjust user settings");
    }

    // Build update object dynamically
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (userAvatar !== undefined) updates.userAvatar = userAvatar;
    if (preference !== undefined) updates.preference = preference;
    if (miscellaneous_data !== undefined) updates.miscellaneous_data = miscellaneous_data;

    if (Object.keys(updates).length === 0) {
        if (log) console.warn(`No fields provided to update for user_id=${userId}`);
        return null; // nothing to update
    }

    try {
        const { data, error } = await client
            .from('userData')
            .update(updates)
            .eq('user_id', userId)
            .select(); // optional: return the updated row

        if (error) {
            if (log) console.error(`Database error while updating user_id=${userId}:`, error);
            throw new Error(`Database error: ${error.message}`);
        }

        if (log) console.log(`Updated user_id=${userId} successfully`, updates);
        return data[0]; // return the updated user
    } catch (err) {
        if (log) console.error(`Error updating user_id=${userId}:`, err);
        throw err;
    }
}
