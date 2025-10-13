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

export const crearPagoMercadoPago = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      console.log('🚀 Función crearPagoMercadoPago iniciada');
      console.log('📋 Datos recibidos:', JSON.stringify(request.data, null, 2));

      const {
        token,
        amount,
        description,
        installments,
        payment_method_id,
        payer
      } = request.data;

      console.log('🔍 Validando datos...');
      console.log('Token presente:', !!token);
      console.log('Amount presente:', !!amount);
      console.log('Payer email presente:', !!payer?.email);

      if (!token || !amount || !payer?.email) {
        console.error('❌ Datos incompletos:', { token: !!token, amount: !!amount, payerEmail: !!payer?.email });
        throw new HttpsError('invalid-argument', 'Datos incompletos para procesar el pago');
      }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    console.log('🔑 Access Token presente:', !!accessToken);
    
    if (!accessToken) {
      console.error('❌ ACCESS_TOKEN no configurado');
      throw new HttpsError('failed-precondition', 'Credenciales de MercadoPago no configuradas');
    }

    const paymentData = {
      transaction_amount: parseFloat(amount),
      token,
      description: description || 'Compra en Homix',
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

    console.log('💰 Datos del pago preparados:', JSON.stringify(paymentData, null, 2));
    console.log('🌐 Enviando solicitud a MercadoPago API...');

    // Generar clave de idempotencia única
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentData)
    });

    console.log('📡 Respuesta HTTP status:', response.status);
    const result = await response.json();
    console.log('📨 Respuesta de MercadoPago:', JSON.stringify(result, null, 2));

    if (response.ok) {
      // Guardar en Firestore si deseas seguimiento
      await db.collection('mercadopago_payments').add({
        paymentId: result.id,
        status: result.status,
        amount: result.transaction_amount,
        payerEmail: payer.email,
        createdAt: new Date()
      });

      return { success: true, payment: result };
    } else {
      console.error('Error en pago:', result);
      throw new HttpsError('internal', 'Error al procesar el pago', result);
    }

  } catch (err: any) {
    console.error('💥 ERROR GLOBAL:', err);
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError('internal', err.message || 'Error interno');
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