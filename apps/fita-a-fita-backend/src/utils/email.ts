import nodemailer, { TransportOptions } from 'nodemailer';
import { type IUserDoc } from '../models/userModel';
import pug from 'pug';
import { convert } from 'html-to-text';
import path from 'path';

class Email {
    to: string;
    firstName: string;
    url: string;
    from: string;

    constructor(user: IUserDoc, url: string) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Mikke <${process.env.EMAIL_FROM}>`;
    }

    createTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            });
        }

        // 1) Create a transporter
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                servername: 'smtp.mailtrap.io',
            },
        } as TransportOptions);
    }

    async send(template: string, subject: string) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(path.join(__dirname, `./../views/email/${template}.pug`), {
            firstName: this.firstName,
            url: this.url,
            subject,
        });
        const text = convert(html, {
            wordwrap: 130,
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: text,
        };
        // 3) Create a transport and send email
        await this.createTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('wellcome', 'Welcome to the Natours Family!');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
    }

    async sendConfrimationEmail() {
        await this.send('confirmEmail', 'Confirm your email');
    }
}

export default Email;
