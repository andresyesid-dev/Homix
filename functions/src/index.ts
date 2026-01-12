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

// Función para crear preferencias de pago en MercadoPago
export const crearPreferenciaMercadoPago = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    cors: true,
  },
  async (req, res) => {
    try {
      console.log('🚀 INICIO - Función crearPreferenciaMercadoPago');
      console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
      console.log('📦 Request method:', req.method);

      // Solo aceptar POST
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Extraer datos del body
      const requestData = req.body.data || req.body;
      const { producto, cantidad = 1, varianteId } = requestData;

      if (!producto) {
        console.error('❌ ERROR: Producto no proporcionado');
        throw new HttpsError('invalid-argument', 'Producto es requerido');
      }

      console.log('🔑 Verificando token de MercadoPago...');
      // Intentar obtener el token de múltiples fuentes
      let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      
      if (!accessToken) {
        console.log('⚠️ Token no encontrado en process.env, intentando valor hardcodeado para pruebas...');
        accessToken = 'TEST-1835594114708460-092413-89bd66bad9c62b1d455362a8f6bc1b8f-1454280654';
      }
      
      if (!accessToken) {
        console.error('❌ ERROR: Token de MercadoPago no encontrado');
        console.log('🔍 Variables de entorno disponibles:', Object.keys(process.env).filter(key => !key.includes('SECRET')));
        throw new HttpsError('failed-precondition', 'Token de MercadoPago no configurado');
      }
      console.log('✅ Token encontrado:', accessToken.substring(0, 20) + '...');

      // Validar campos obligatorios del producto
      if (!producto.nombre || !producto.precio) {
        console.error('❌ ERROR: Producto sin nombre o precio:', { nombre: producto.nombre, precio: producto.precio });
        throw new HttpsError('invalid-argument', 'Producto debe tener nombre y precio');
      }

      // Construir la preferencia de pago - Solo campos básicos para MercadoPago
      const title = producto.nombre.toString();
      const price = parseFloat(producto.precio.toString());
      
      // Validar que el precio sea válido
      if (isNaN(price) || price <= 0) {
        console.error('❌ ERROR: Precio inválido:', { precio: producto.precio, parsed: price });
        throw new HttpsError('invalid-argument', 'El precio del producto debe ser un número válido mayor a 0');
      }
      
      // Validar cantidad
      const cantidadNum = parseInt(cantidad.toString());
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        console.error('❌ ERROR: Cantidad inválida:', { cantidad, parsed: cantidadNum });
        throw new HttpsError('invalid-argument', 'La cantidad debe ser un número válido mayor a 0');
      }

      console.log('✅ Datos validados:', { title, price, cantidadNum });
      
      // Crear descripción opcional con detalles del producto
      let description = '';
      if (producto.descripcion) {
        description = producto.descripcion;
      }
      
      // Si hay variante seleccionada, agregarla a la descripción
      if (varianteId) {
        description += description ? ` - Variante: ${varianteId}` : `Variante: ${varianteId}`;
      }
      
      console.log('📝 Preparando preferencia para MercadoPago...');

      // Crear preferencia completa para MercadoPago
      const preference = {
        items: [{
          title: title.substring(0, 256), // Limitar título a 256 caracteres
          quantity: cantidadNum,
          unit_price: price,
          currency_id: 'COP'
        }],
        // TODO: Configurar back_urls con dominio público en producción
        // back_urls: {
        //   success: 'https://tu-dominio.com/pago-exitoso',
        //   failure: 'https://tu-dominio.com/pago-fallido',
        //   pending: 'https://tu-dominio.com/pago-pendiente'
        // },
        // auto_return: 'approved',
        notification_url: 'https://us-central1-joum-b86f6.cloudfunctions.net/webhookMercadoPago',
        external_reference: `joum-${producto.id}-${Date.now()}`,
        // Configuración para testing
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        }
      };
      
      console.log('🎯 Preferencia a enviar (MÍNIMA):', JSON.stringify(preference, null, 2));

      // Llamar a la API de MercadoPago
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(preference)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from MercadoPago:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          sentData: preference,
          accessTokenStart: accessToken?.substring(0, 20) + '...'
        });
        
        // Intentar parsear el error de MercadoPago para más detalles
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed MercadoPago error:', errorJson);
        } catch (parseErr) {
          console.error('Could not parse error response as JSON');
        }
        
        throw new Error(`Error de MercadoPago: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('✅ Preferencia creada exitosamente:', result.id);

      // Guardar la preferencia en Firestore para seguimiento
      const externalRef = `${producto.id || 'unknown'}-${Date.now()}`;
      await db.collection('mercadopago_preferences').add({
        preferenceId: result.id,
        productId: producto.id || 'unknown',
        amount: price * cantidadNum,
        quantity: cantidadNum,
        userId: null, // Sin autenticación en la función HTTP
        status: 'created',
        createdAt: new Date(),
        externalReference: externalRef
      });

      console.log('💾 Preferencia guardada en Firestore');

      console.log('🎉 ÉXITO - Proceso completado');
      res.json({
        success: true,
        preferenceId: result.id,
        initPoint: result.init_point,
        sandboxInitPoint: result.sandbox_init_point
      });

    } catch (err: any) {
      console.error('💥 ERROR GLOBAL:', err);
      console.error('📍 Stack trace:', err.stack);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message 
      });
    }
  }
);

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