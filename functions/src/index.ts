import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import twilio from 'twilio';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

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

export const crearPagoMercadoPago = onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const {
      token,
      amount,
      description,
      installments,
      payment_method_id,
      payer
    } = req.body;

    if (!token || !amount || !payer?.email) {
      res.status(400).json({ error: 'Datos incompletos para procesar el pago' });
      return;
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const paymentData = {
      transaction_amount: parseFloat(amount),
      token,
      description: description || 'Compra en Joum',
      installments: installments || 1,
      payment_method_id,
      payer: {
        email: payer.email,
        identification: {
          type: payer.identification?.type || 'CC',
          number: payer.identification?.number || ''
        }
      }
    };

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (response.ok) {
      // Guardar en Firestore si deseas seguimiento
      await db.collection('mercadopago_payments').add({
        paymentId: result.id,
        status: result.status,
        amount: result.transaction_amount,
        payerEmail: payer.email,
        createdAt: new Date()
      });

      res.json({ success: true, payment: result });
    } else {
      console.error('Error en pago:', result);
      res.status(500).json({ error: 'Error al procesar el pago', details: result });
    }

  } catch (err: any) {
    console.error('💥 ERROR GLOBAL:', err);
    res.status(500).json({ error: 'Error interno', message: err.message });
  }
});

// Webhook para recibir notificaciones de MercadoPago
export const webhookMercadoPago = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
      }

      const { type, data } = req.body;

      if (type === 'payment') {
        const paymentId = data.id;
        
        // Obtener información del pago
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          
          // Actualizar estado en Firestore
          const preferencesQuery = await db.collection('mercadopago_preferences')
            .where('externalReference', '==', paymentData.external_reference)
            .limit(1)
            .get();

          if (!preferencesQuery.empty) {
            const preferenceDoc = preferencesQuery.docs[0];
            await preferenceDoc.ref.update({
              paymentId: paymentId,
              status: paymentData.status,
              paymentMethod: paymentData.payment_method_id,
              transactionAmount: paymentData.transaction_amount,
              updatedAt: new Date()
            });

            // Si el pago fue aprobado, actualizar inventario
            if (paymentData.status === 'approved') {
              // Aquí puedes agregar lógica para actualizar el inventario
              // o enviar confirmaciones al usuario
              console.log(`Pago aprobado: ${paymentId}`);
            }
          }
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error procesando webhook:', error);
      res.status(500).send('Error interno');
    }
  }
);