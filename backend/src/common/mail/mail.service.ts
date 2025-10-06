import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

@Injectable()
export class MailerService {
    private transporter;
    private logger = new Logger(MailerService.name);

    constructor() {
        this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: false, // TLS se negociará si es necesario
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        });
    }

    async sendVerificationEmail(to: string, token: string, tipo: 'registro' | 'actualizacion') {
        const appUrl = process.env.APP_URL;
        let verifyUrl: string;   //`${process.env.APP_URL}/usuario/confirmar-cambio-correo?token=${token}`;              //`${appUrl}/usuario/confirmar-cambio-correo?token=${token}`;
        let html: string;

        if (tipo === 'registro') {
            verifyUrl = `${appUrl}/usuario/confirmar-registro?token=${token}`;
            html = `
                <p>Hola,</p>
                <p>Para activar tu cuenta haz clic en el siguiente enlace:</p>
                <p><a href="${verifyUrl}">Confirmar correo</a></p>
                <br><br>
                <p>Si no te registraste, ignora este correo.</p>
            `;
        } else {
            verifyUrl = `${appUrl}/usuario/confirmar-cambio-correo?token=${token}`;
            html = `
                <p>Hola,</p>
                <p>Para confirmar tu nuevo correo haz clic en el siguiente enlace:</p>
                <p><a href="${verifyUrl}">Confirmar correo</a></p>
                <br><br>
                <p>Si no solicitaste este cambio, ignora este correo.</p>
            `;
        }

        return this.transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject:
            tipo === 'registro'
                ? 'Confirma tu cuenta'
                : 'Confirma tu cambio de correo',
            html,
        });
    } 
}