import 'dotenv/config';

export const emailConfig = { 
    smtpServer:process.env.SMTP_SERVER,
    smtpPort:process.env.PORT,
    smtpLogin:process.env.LOGIN,
    smtpKeyValue:process.env.SMTP_KEY_VALUE,
    email:process.env.EMAIL_FROM
};

export const serverConfig = {
    port:process.env.PORT
};

export const databaseConfig = {
    supabaseUrl:process.env.SUPABASE_URL,
    supabaseKey:process.env.SUPABASE_KEY
};

export const environmentConfig = {
    log:Boolean(process.env.LOG)
};
