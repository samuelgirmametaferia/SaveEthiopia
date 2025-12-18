import { emailConfig, environmentConfig } from "../config";
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs/promises";
const log = environmentConfig.log;


const transporter = nodemailer.createTransport({
    host: emailConfig.smtpServer,
    port: emailConfig.port,
    secure: false,
    requireTLS: true,
    auth: {
        user: emailConfig.smtpLogin,
        pass: emailConfig.smtpKeyValue
    },

});

export async function sendEmail(To, Subject, HTML, Text = '') {
    try {
        const mailOptions = {
            from: `"Sender Name" <${emailConfig.smtpLogin}>`,
            to: To,
            subject: Subject,
            text: Text,
            html: HTML,
        };

        const info = await transporter.sendMail(mailOptions);

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (err) {
        return {
            success: false,
            error: err.code ?? err.message,
        };
    }
}

export async function sendCodeEmail(To,
    Subject,
    code,
    authEmail = "./templates/auth.html") {

    const _retfile = path.resolve(authEmail);


    try {
        // Specify 'utf-8' encoding to get a string instead of a raw Buffer
        const emailContent = (await fs.readFile(_retfile, 'utf-8')).replace(/{{CODE}}/g, code);
        if (log) console.log("File contents:", emailContent);
        return await sendEmail(To, Subject, emailContent);
    } catch (error) {
        if (log) console.error("Error reading file:", error.message);
        return {
            success: false,
            error: error.code ?? error.message
        };
    }

}