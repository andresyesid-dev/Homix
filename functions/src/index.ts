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
      
      // Asegurar prefijo whatsapp: en el número de origen
      const rawNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
      const twilioWhatsAppNumber = rawNumber.startsWith('whatsapp:') ? rawNumber : `whatsapp:${rawNumber}`;
      
      const message = await client.messages.create({
        from: twilioWhatsAppNumber,
        to: `whatsapp:${numero}`,
        body: `Tu código de verificación es: ${codigo}`
      });
      return { success: true, sid: message.sid };
    } catch (err: any) {
      throw new HttpsError('internal', err.message);
    }
  }
);

// Función HTTPS callable para enviar SMS (GCF Gen2)
export const enviarSMS = onCall(
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
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        throw new HttpsError('failed-precondition', 'Credenciales de Twilio no configuradas');
      }

      const client = twilio(accountSid, authToken);

      const twilioSmsNumber = process.env.TWILIO_SMS_NUMBER;
      if (!twilioSmsNumber) {
        throw new HttpsError('failed-precondition', 'Número SMS de Twilio no configurado (TWILIO_SMS_NUMBER)');
      }

      const message = await client.messages.create({
        from: twilioSmsNumber,
        to: numero,
        body: `Tu código de verificación Homix es: ${codigo}`
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

      // Extraer IP del usuario
      const userIp = request.rawRequest.headers['x-forwarded-for']?.toString().split(',')[0].trim() 
                     || request.rawRequest.headers['x-real-ip']?.toString()
                     || request.rawRequest.socket.remoteAddress 
                     || '127.0.0.1';
      console.log('🌐 IP del usuario:', userIp);

      const {
        token,
        amount,
        description,
        installments,
        payment_method_id,
        payer,
        transaction_details,
        callback_url // URL de retorno después del pago (para PSE)
      } = request.data;

      // Determinar si es un pago con token (tarjetas) o sin token (PSE, Efecty, etc.)
      const esPagoConTarjeta = !!token;
      const esPSE = payment_method_id === 'pse';

      console.log('🔍 Validando datos...');
      console.log('Tipo de pago:', esPagoConTarjeta ? 'Tarjeta (con token)' : 'PSE/Efecty/Ticket (sin token)');
      console.log('Payment method ID:', payment_method_id);
      console.log('Es PSE:', esPSE);
      console.log('Token presente:', !!token);
      console.log('Amount presente:', !!amount);
      console.log('Payer email presente:', !!payer?.email);
      
      // Validación específica para PSE
      if (esPSE) {
        console.log('🏦 Validación PSE:');
        console.log('- Entity type presente:', !!payer?.entity_type);
        console.log('- Financial institution presente:', !!transaction_details?.financial_institution);
        
        if (!payer?.entity_type) {
          console.error('❌ PSE requiere entity_type');
          throw new HttpsError('invalid-argument', 'PSE requiere entity_type (individual o association)');
        }
        
        if (!transaction_details?.financial_institution) {
          console.error('❌ PSE requiere financial_institution');
          throw new HttpsError('invalid-argument', 'PSE requiere financial_institution (código del banco)');
        }
      }

      // Validaciones básicas (el token no es requerido para PSE/Efecty)
      if (!amount || !payer?.email || !payment_method_id) {
        console.error('❌ Datos incompletos:', { 
          amount: !!amount, 
          payerEmail: !!payer?.email,
          payment_method_id: !!payment_method_id
        });
        throw new HttpsError('invalid-argument', 'Datos incompletos para procesar el pago');
      }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    console.log('🔑 Access Token presente:', !!accessToken);
    
    if (!accessToken) {
      console.error('❌ ACCESS_TOKEN no configurado');
      throw new HttpsError('failed-precondition', 'Credenciales de MercadoPago no configuradas');
    }

    // Construir datos del pago según el tipo
    const paymentData: any = {
      transaction_amount: parseFloat(amount),
      description: description || 'Compra en Homix',
      payment_method_id,
      payer: {
        email: payer.email,
        identification: payer.identification ? {
          type: payer.identification.type || 'CC',
          number: payer.identification.number || ''
        } : undefined
      },
      additional_info: {
        ip_address: userIp
      }
    };

    // Solo agregar token y cuotas si es pago con tarjeta
    if (esPagoConTarjeta) {
      paymentData.token = token;
      paymentData.installments = installments || 1;
      console.log('💳 Pago con tarjeta - Token y cuotas incluidos');
    } else {
      console.log('🏦 Pago sin token (PSE/Efecty/Ticket)');
      
      // Para PSE, agregar entity_type, transaction_details y callback_url
      if (esPSE) {
        if (payer.entity_type) {
          paymentData.payer.entity_type = payer.entity_type;
          console.log('🏦 PSE - entity_type agregado:', payer.entity_type);
        }
        
        // Callback URL obligatorio para PSE - redirige al usuario después del pago
        // Si no se proporciona, usar una URL por defecto de producción
        const pseCallbackUrl = callback_url || 'https://homix0523.web.app/comprar/checkout/response';
        paymentData.callback_url = pseCallbackUrl;
        console.log('🔗 PSE - callback_url agregado:', paymentData.callback_url);
        
        // Notification URL para webhooks - MercadoPago notificará aquí cuando cambie el estado
        paymentData.notification_url = 'https://us-central1-homix0523.cloudfunctions.net/webhookMercadoPago';
        console.log('🔔 PSE - notification_url agregado:', paymentData.notification_url);
      }
      
      // Para métodos sin token, pueden venir datos adicionales
      if (transaction_details) {
        paymentData.transaction_details = transaction_details;
        console.log('📋 Transaction details agregados:', transaction_details);
      }
    }

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
      // Log específico para PSE
      if (esPSE && result.transaction_details?.external_resource_url) {
        console.log('🏦 PSE - URL del banco encontrada:', result.transaction_details.external_resource_url);
      }
      
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
      console.log('🔔 Webhook recibido:', JSON.stringify(req.body, null, 2));
      
      if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
      }

      const { type, data, action } = req.body;
      
      console.log('📨 Tipo de notificación:', type);
      console.log('🎬 Acción:', action);

      // MercadoPago envía notificaciones de tipo "payment"
      if (type === 'payment' || action === 'payment.updated') {
        const paymentId = data.id;
        console.log('💳 Payment ID:', paymentId);
        
        // Obtener información completa del pago desde MercadoPago
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        
        if (!accessToken) {
          console.error('❌ Access token no configurado');
          res.status(500).send('Access token no configurado');
          return;
        }
        
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          
          console.log('✅ Datos del pago obtenidos:', {
            id: paymentData.id,
            status: paymentData.status,
            status_detail: paymentData.status_detail,
            payment_method_id: paymentData.payment_method_id,
            transaction_amount: paymentData.transaction_amount
          });
          
          // Actualizar o crear documento en Firestore con el estado del pago
          await db.collection('mercadopago_payments').doc(paymentId.toString()).set({
            paymentId: paymentData.id,
            status: paymentData.status,
            status_detail: paymentData.status_detail,
            payment_method_id: paymentData.payment_method_id,
            payment_type_id: paymentData.payment_type_id,
            transaction_amount: paymentData.transaction_amount,
            payer_email: paymentData.payer?.email || null,
            external_reference: paymentData.external_reference || null,
            date_created: paymentData.date_created,
            date_approved: paymentData.date_approved || null,
            date_last_updated: paymentData.date_last_updated,
            updatedAt: new Date(),
            webhookReceived: true
          }, { merge: true });
          
          console.log('✅ Estado del pago actualizado en Firestore');
          
          res.status(200).send('OK');
        } else {
          console.error('❌ Error obteniendo datos del pago:', paymentResponse.status);
          res.status(500).send('Error obteniendo datos del pago');
        }
      } else {
        console.log('ℹ️ Tipo de notificación no manejada:', type);
        res.status(200).send('OK');
      }
    } catch (error: any) {
      console.error('💥 Error en webhook:', error);
      res.status(500).send('Error en webhook');
    }
  }
);

// Función de testing para simular aprobación de pago (solo para desarrollo)
export const simularAprobacionPago = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    try {
      const paymentId = req.query.payment_id as string;
      
      if (!paymentId) {
        res.status(400).send('payment_id es requerido');
        return;
      }
      
      console.log('🧪 TESTING - Simulando aprobación de pago:', paymentId);
      
      // Actualizar el pago en Firestore simulando que fue aprobado
      await db.collection('mercadopago_payments').doc(paymentId).set({
        paymentId: paymentId,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'pse',
        payment_type_id: 'bank_transfer',
        transaction_amount: 98000,
        payer_email: 'test@test.com',
        date_created: new Date().toISOString(),
        date_approved: new Date().toISOString(),
        date_last_updated: new Date().toISOString(),
        updatedAt: new Date(),
        webhookReceived: true,
        simulatedForTesting: true
      }, { merge: true });
      
      console.log('✅ Pago simulado como aprobado en Firestore');
      
      res.status(200).json({
        success: true,
        message: 'Pago simulado como aprobado',
        payment_id: paymentId
      });
      
    } catch (error: any) {
      console.error('❌ Error simulando pago:', error);
      res.status(500).send('Error simulando pago');
    }
  }
);