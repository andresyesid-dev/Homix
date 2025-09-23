import { onCall, HttpsError } from 'firebase-functions/v2/https';
import twilio from 'twilio';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Función HTTPS callable para enviar WhatsApp (GCF Gen2)
export const enviarWhatsApp = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    const numero = request.data?.numero;
    const codigo = request.data?.codigo;

    if (!numero || !codigo) {
      throw new HttpsError('invalid-argument', 'Número y código son requeridos');
    }

    try {
      // Obtener credenciales de Twilio desde variables de entorno
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        throw new HttpsError('failed-precondition', 'Credenciales de Twilio no configuradas');
      }

      const client = twilio(accountSid, authToken);
      
      const message = await client.messages.create({
        from: 'whatsapp:+14155238886',
        to: `whatsapp:${numero}`,
        body: `Tu código de verificación es: ${codigo}`
      });
      return { success: true, sid: message.sid };
    } catch (err: any) {
      throw new HttpsError('internal', err.message);
    }
  }
);