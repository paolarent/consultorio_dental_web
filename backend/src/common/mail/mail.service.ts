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
        const appFrontUrl = process.env.FRONTEND_URL;
        let verifyUrl: string;   //`${process.env.APP_URL}/usuario/confirmar-cambio-correo?token=${token}`;              //`${appUrl}/usuario/confirmar-cambio-correo?token=${token}`;
        let asunto: string;
        let mensajePrincipal: string;
        let mensajeExtra: string;

        if (tipo === 'registro') {
            //verifyUrl = `${appUrl}/usuario/confirmar-registro?token=${token}`;
            verifyUrl = `${appFrontUrl}/login/restore-password?token=${token}&tipo=registro`;
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

    //--------------------------------------------------------------------------------------------------------------------------------------------
    // MÉTODOS PARA SISTEMA DE CITAS

    //Enviar notificación de cita (confirmación, cancelación, etc.)
    async enviarNotificacionCita(
        to: string,
        tipo: 'programada' | 'cancelada' | 'solicitud_pendiente',
        datos: {
            fecha: string;
            hora: string;
            nombrePaciente?: string;
        },
        logoUrl: string,
        nombreDoc?: string
    ) {
        let asunto: string;
        let mensaje: string;

        switch (tipo) {
            case 'programada':
                asunto = 'Cita Programada';
                mensaje = `Tu cita ha sido programada exitosamente para el <strong>${this.formatearFecha(datos.fecha)}</strong> a las <strong>${this.formatearHora(datos.hora)}</strong>.`;
                break;
            
            case 'cancelada':
                asunto = 'Cita Cancelada';
                mensaje = `Tu cita programada el <strong>${this.formatearFecha(datos.fecha)}</strong> a las <strong>${this.formatearHora(datos.hora)}</strong> ha sido cancelada. Por favor considera re-agendar`;
                break;
            
            case 'solicitud_pendiente':
                asunto = 'Nueva Solicitud de Cita';
                mensaje = `El paciente <strong>${datos.nombrePaciente}</strong> ha solicitado una cita el <strong>${this.formatearFecha(datos.fecha)}</strong> a las <strong>${this.formatearHora(datos.hora)}</strong>. Por favor, ingresa, revisa y confirma la cita.`;
                break;
        }

        const html = `
        <div style="background-color: #f0f0f0; padding: 40px 0; font-family: Arial, sans-serif;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 40px;">
                <img src="${logoUrl}" alt="Logo" style="width: 220px; margin: 0 auto 20px; display: block; border-radius:10px" />
                <h2 style="color: #1D8F93; font-size: 24px; margin-bottom: 20px; text-align: center;">${asunto}</h2>
                <div style="background-color: #C3F2F3; padding: 20px; border-radius: 8px; margin: 20px 30px;">
                    <p style="color: #000000; text-aling: center; font-size: 18px; margin: 0; line-height: 1.6;">${mensaje}</p>
                </div>
                ${tipo === 'solicitud_pendiente' ? `
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL}/doc/mi-agenda/citas" style="display: inline-block; padding: 14px 30px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #1D8F93; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                            Ver cita
                        </a>
                    </div>
                ` : ''}
                <p style="color: #545454; font-size: 14px; margin-top: 30px; text-align: center;">
                    Si tienes alguna duda, no dudes en contactarnos.
                </p>
            </div>
        </div>
        `;

        await this.transporter.sendMail({
            from: `Dr. ${nombreDoc ?? 'Odontix 🦷'} <${EMAIL_FROM}>`,
            to,
            subject: asunto,
            html
        });

        this.logger.log(`Notificación de cita enviada a ${to}: ${tipo}`);
    }

    // Enviar notificación de reprogramación
    async enviarNotificacionReprogramacion(
        to: string,
        tipo: 'solicitud' | 'aceptada' | 'rechazada',
        datos: {
            fechaOriginal: string;
            horaOriginal: string;
            nuevaFecha: string;
            nuevaHora: string;
            solicitadoPor?: string;
        },
        logoUrl: string,
        nombreDoc?: string
    ) {    
        let asunto: string;
        let mensaje: string;

        switch (tipo) {
            case 'solicitud':
                asunto = 'Solicitud de Reprogramación de Cita';
                mensaje = `Se ha solicitado reprogramar su cita de <strong>${this.formatearFecha(datos.fechaOriginal)}</strong> a las <strong>${this.formatearHora(datos.horaOriginal)}</strong> para el <strong>${this.formatearFecha(datos.nuevaFecha)}</strong> a las <strong>${this.formatearHora(datos.nuevaHora)}</strong>. Por favor, confirma si aceptas el cambio.`;
                break;
            
            case 'aceptada':
                asunto = 'Cita Reprogramada';
                mensaje = `Tu solicitud de reprogramación ha sido aceptada. La cita ahora está programada para el <strong>${this.formatearFecha(datos.nuevaFecha)}</strong> a las <strong>${this.formatearHora(datos.nuevaHora)}</strong>.`;
                break;
            
            case 'rechazada':
                asunto = 'Solicitud de Reprogramación Rechazada';
                mensaje = `Tu solicitud de reprogramación ha sido rechazada. Tu cita permanece en la fecha original: <strong>${this.formatearFecha(datos.fechaOriginal)}</strong> a las <strong>${this.formatearHora(datos.horaOriginal)}</strong>. Si no podra asistir por favor ingrese y cancele.`;
                break;
        }

        const html = `
        <div style="background-color: #f0f0f0; padding: 40px 0; font-family: Arial, sans-serif;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 40px;">
                <img src="${logoUrl}" alt="Logo" style="width: 220px; margin: 0 auto 20px; display: block; border-radius:10px" />
                <h2 style="color: #1D8F93; font-size: 24px; margin-bottom: 20px; text-align: center;">${asunto}</h2>
                <div style="background-color: #C3F2F3; padding: 20px; border-radius: 8px; margin: 20px 30px;">
                    <p style="color: #000000; text-aling: center; font-size: 18px; margin: 0; line-height: 1.6;">${mensaje}</p>
                </div>
                ${tipo === 'solicitud' ? `
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 14px 28px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #1D8F93; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                            Revisar solicitud
                        </a>
                    </div>
                ` : ''}
                <p style="color: #545454; font-size: 14px; margin-top: 30px; text-align: center;">
                    Gracias por tu comprensión.
                </p>
            </div>
        </div>
        `;

        await this.transporter.sendMail({
            from: `Dr. ${nombreDoc ?? 'Odontix 🦷'} <${EMAIL_FROM}>`,
            to,
            subject: asunto,
            html
        });

        this.logger.log(`Notificación de reprogramación enviada a ${to}: ${tipo}`);
    }

    //Enviar recordatorio de cita (1 día antes)
    async enviarRecordatorioCita(
        to: string,
        datos: {
            fecha: string;
            hora: string;
            nombreDentista: string;
        },
        logoUrl: string,
        nombreDoc?: string
    ) {
        const html = `
        <div style="background-color: #f0f0f0; padding: 40px 0; font-family: Arial, sans-serif;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 40px;">
                <img src="${logoUrl}" alt="Logo" style="width: 220px; margin: 0 auto 20px; display: block; border-radius:10px" />
                <h2 style="color: #000000; font-size: 24px; margin-bottom: 20px; text-align: center;">Recordatorio de cita</h2>
                <div style="background-color: #DBEAFE; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin-bottom: 20px;">
                    <p style="color: #1E40AF; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">
                        Tienes una cita mañana
                    </p>
                    <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.6;">
                        <strong>Fecha:</strong> ${this.formatearFecha(datos.fecha)}<br>
                        <strong>Hora:</strong> ${this.formatearHora(datos.hora)}<br>
                        <strong>Dentista:</strong> Dr. ${datos.nombreDentista}
                    </p>
                </div>
                <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 30px;">
                    <p style="color: #330101; font-size: 16px; margin: 0;">
                        ⏰ <strong>Recomendación:</strong> Te sugerimos llegar 10 minutos antes de tu cita.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL}/home/citas" style="display: inline-block; padding: 14px 28px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #1D8F93; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                        Ver mis citas
                    </a>
                </div>
                <p style="color: #545454; font-size: 14px; margin-top: 30px; text-align: center;">
                    Si necesitas cancelar o reprogramar, hazlo con al menos 2 horas de anticipación.
                </p>
            </div>
        </div>
        `;

        await this.transporter.sendMail({
            from: `Dr. ${nombreDoc ?? 'Odontix 🦷'} <${EMAIL_FROM}>`,
            to,
            subject: 'Recordatorio: Tienes una cita con tu dentista mañana',
            html
        });

        this.logger.log(`Recordatorio de cita enviado a ${to}`);
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================
    
    private formatearFecha(fecha: string): string {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Crear fecha en horario local
        const date = new Date(`${fecha}T00:00:00`);

        // Ajustar timezone (igual que en crearCita)
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

        return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
    }


    private formatearHora(hora: string): string {
        // Asume formato "HH:mm:ss+00:00" o "HH:mm"
        const [hh, mm] = hora.split(':');
        return `${hh}:${mm}`;
    }

}