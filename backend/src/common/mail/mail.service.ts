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

    async sendVerificationEmail(to: string, token: string, tipo: 'registro' | 'actualizacion', logoUrl: string, nombreDoc: string) {
        const appUrl = process.env.APP_URL;
        let verifyUrl: string;   //`${process.env.APP_URL}/usuario/confirmar-cambio-correo?token=${token}`;              //`${appUrl}/usuario/confirmar-cambio-correo?token=${token}`;
        let asunto: string;
        let mensajePrincipal: string;
        let mensajeExtra: string;

        if (tipo === 'registro') {
            verifyUrl = `${appUrl}/usuario/confirmar-registro?token=${token}`;
            asunto = 'Confirma tu cuenta';
            mensajePrincipal =
                'Gracias por registrarte. Haz clic en el botón para activar tu cuenta.';
            mensajeExtra =
                'Si no te registraste, puedes ignorar este correo.';
        } else {
            verifyUrl = `${appUrl}/usuario/confirmar-cambio-correo?token=${token}`;
            asunto = 'Confirma tu cambio de correo';
            mensajePrincipal =
                'Has solicitado cambiar tu correo. Haz clic en el botón para confirmarlo.';
            mensajeExtra =
                'Si no solicitaste este cambio, ignora este mensaje.';
        }

        const html = `
            <div style="
                background-color: #f0f0f0;
                padding: 40px 0;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    max-width: 400px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    padding: 40px;
                    text-align: center;
                ">
                    <img src="${logoUrl}" alt="Logo" style="width: 220px; margin-bottom: 14px; border-radius:10px" />
                    <h2 style="color: #000000; font-size: 24px; margin-bottom: 16px;">${asunto}</h2>
                    <p style="color: #545454; font-size: 16px; margin-bottom: 30px;">
                        ${mensajePrincipal}
                    </p>
                    <a href="${verifyUrl}" style="
                        display: inline-block;
                        padding: 14px 28px;
                        font-size: 18px;
                        font-weight: bold;
                        color: #ffffff;
                        background-color: #1D8F93;
                        border-radius: 12px;
                        text-decoration: none;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                        transition: all 0.3s ease;
                    ">
                        Confirmar ahora
                    </a>
                    <p style="color: #621313ff; font-size: 14px; margin-top: 40px;">
                        ${mensajeExtra}
                    </p>
                </div>
            </div>
            `;

        await this.transporter.sendMail({
            from: `Dr. ${nombreDoc} <${EMAIL_FROM}>`,
            to,
            subject: asunto,
            html
        });
    } 

    //METODO PARA RESTABLECER CONTRASEÑA
    async enviarCorreoRecuperacion(to: string, enlace: string, logoUrl: string, nombreDoc: string) {
        const html = `
        <div style="
            background-color: #f0f0f0;
            padding: 40px 0;
            font-family: Arial, sans-serif;
        ">
            <div style="
                max-width: 400px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                padding: 40px;
                text-align: center;
            ">
                <img src="${logoUrl}" alt="Logo" style="width: 220px; margin-bottom: 14px; border-radius:10px" />
                <h2 style="color: #000000; font-size: 24px; margin-bottom: 16px;">Restablece tu contraseña</h2>
                <p style="color: #545454; font-size: 16px; margin-bottom: 30px;">
                    Hola!, Has solicitado restablecer tu contraseña. Haz clic en el botón para establecer una nueva.
                </p>
                <a href="${enlace}" style="
                    display: inline-block;
                    padding: 14px 28px;
                    font-size: 18px;
                    font-weight: bold;
                    color: #ffffff;
                    background-color: #1D8F93;
                    border-radius: 12px;
                    text-decoration: none;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2); /* sombra */
                    transition: all 0.3s ease; /* animación suave (funciona en web) */
                ">
                    Restablecer contraseña
                </a>
                <p style="color: #621313ff; font-size: 14px; margin-top: 40px;">
                    Si no solicitaste este cambio, ignora este correo. Este enlace expirará en 10 minutos.
                </p>
            </div>
        </div>
        `;

        await this.transporter.sendMail({
            from: `Dr. ${nombreDoc} <${EMAIL_FROM}>`, //el nombre del doctor sera dinamico al mandar el correo
            to,
            subject: 'Recuperación de contraseña',
            html,
        });
    }

}