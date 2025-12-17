import { databaseConfig } from "../config";
import { createClient } from "@supabase/supabase-js/dist/index.cjs";

export const client = createClient(databaseConfig.supabaseUrl,databaseConfig.supabaseKey);

