# 🧪 Guía de Pruebas - Flujo PSE con MercadoPago

## 📋 Resumen del Flujo

El flujo completo de PSE funciona de la siguiente manera:

1. **Usuario inicia pago PSE** → Frontend captura datos (entity_type, bank)
2. **Cloud Function crea pago** → MercadoPago genera external_resource_url
3. **Usuario redirigido a banco** → Se abre nueva pestaña con página PSE
4. **Usuario completa pago en banco** → Autoriza transferencia
5. **MercadoPago envía webhook** → Notifica cambio de estado
6. **Cloud Function actualiza Firestore** → Guarda estado en `mercadopago_payments/{payment_id}`
7. **Frontend detecta cambio** → Listener `onSnapshot` actualiza UI automáticamente
8. **Se crea la venta** → Sistema registra compra en Firestore

---

## 🚀 Cómo Probar el Flujo Completo

### Opción 1: Flujo Real (Sandbox MercadoPago)

⚠️ **Nota**: El sandbox de MercadoPago puede mostrar errores intermitentes ("Algo salió mal")

1. Navega a la página de checkout
2. Selecciona PSE como método de pago
3. Completa los datos:
   - **Tipo de persona**: Individual o Empresa
   - **Banco**: Bancolombia, Banco de Bogotá, etc.
   - **Tipo de documento**: CC (Cédula)
   - **Número de documento**: Cualquier número válido
   - **Email**: Tu email
4. Haz clic en "Pagar con PSE"
5. Se abrirá una nueva pestaña con la página del banco (simulada)
6. Completa el proceso en la página del banco
7. El webhook de MercadoPago actualizará automáticamente el estado
8. La página original se actualizará en tiempo real

---

### Opción 2: Simulación con Endpoint de Testing (Recomendado)

Esta opción es más confiable para testing porque evita los problemas del sandbox.

#### Paso 1: Iniciar un pago PSE normal

```bash
# Sigue los pasos 1-4 de la Opción 1
# Después del pago, copia el payment_id de la consola del navegador
```

**Ejemplo de log en consola**:
```
💳 Procesando pago...
📊 Estado del pago guardado: {payment_id: "1234567890", status: "pending", ...}
```

#### Paso 2: Copiar el payment_id

El payment_id aparecerá en varios lugares:
- En la URL de respuesta: `?payment_id=1234567890`
- En la consola del navegador
- En el estado del pago en pantalla

#### Paso 3: Llamar al endpoint de simulación

```bash
# Reemplaza PAYMENT_ID con tu ID real
curl "https://us-central1-homix0523.cloudfunctions.net/simularAprobacionPago?payment_id=PAYMENT_ID"
```

**Ejemplo real**:
```bash
curl "https://us-central1-homix0523.cloudfunctions.net/simularAprobacionPago?payment_id=1234567890"
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Pago simulado como aprobado",
  "payment_id": "1234567890"
}
```

#### Paso 4: Observar la actualización automática

Después de llamar al endpoint:

1. **Frontend detecta cambio** (< 1 segundo)
   - Mensaje: "Registrando tu compra..." con spinner
   - Color cambia de amarillo (pending) a verde (approved)

2. **Venta se crea en Firestore** (2-3 segundos)
   - Mensaje: "¡Tu compra ha sido registrada exitosamente!"
   - Se muestra el ícono de confirmación

3. **Verificar en Firestore** (opcional)
   ```javascript
   // Colección: ventas
   // Buscar documento con payment_id: "1234567890"
   ```

---

## 🔍 Logs para Monitorear

### Frontend (Consola del Navegador)

```javascript
// 1. Inicio del proceso
💳 Procesando pago...
🔍 Es PSE, añadiendo campos requeridos

// 2. Pago creado
✅ Pago procesado exitosamente
📊 Estado del pago guardado

// 3. Escuchando actualizaciones
👂 Escuchando actualizaciones del pago: 1234567890

// 4. Webhook recibido
🔄 Actualización de pago recibida: {status: 'approved', ...}
🎉 ¡Pago aprobado! Notificando al servicio...

// 5. Creando venta
✅ Pago aprobado recibido en ComprarComponent
📦 Creando venta en Firestore con datos de pago...
✅ Venta registrada en Firestore
```

### Cloud Functions (Firebase Console)

```
// webhookMercadoPago
📥 Webhook de MercadoPago recibido
✅ Pago actualizado en Firestore: 1234567890

// simularAprobacionPago (solo testing)
🧪 TESTING - Simulando aprobación de pago: 1234567890
✅ Pago simulado como aprobado en Firestore
```

---

## 📊 Estructura de Datos

### Firestore: `mercadopago_payments/{payment_id}`

```javascript
{
  paymentId: "1234567890",
  status: "approved",              // pending → approved
  status_detail: "accredited",
  payment_method_id: "pse",
  payment_type_id: "bank_transfer",
  transaction_amount: 98000,
  payer_email: "usuario@example.com",
  date_created: "2024-01-15T10:30:00.000Z",
  date_approved: "2024-01-15T10:32:00.000Z",
  updatedAt: Timestamp,
  webhookReceived: true
}
```

### Firestore: `ventas/{venta_id}`

```javascript
{
  numVenta: 123,
  referencias: [...],
  fechaVenta: Timestamp,
  idCliente: "user123",
  idVendedor: "vendor456",
  datosEnvio: {...},
  
  // Datos de pago (agregados automáticamente)
  payment_id: "1234567890",
  payment_status: "approved",
  payment_method: "pse",
  transaction_amount: 98000,
  
  // Estados
  enCamino: false,
  entregado: false,
  cancelada: false
}
```

---

## ✅ Checklist de Verificación

Después de cada prueba, verifica que:

- [ ] El pago se creó en MercadoPago (status code 201)
- [ ] El payment_id es visible en la URL y en pantalla
- [ ] El listener está activo (log: "👂 Escuchando actualizaciones")
- [ ] El webhook actualiza Firestore (verificar en Firebase Console)
- [ ] El frontend detecta el cambio (UI se actualiza automáticamente)
- [ ] Aparece el mensaje "Registrando tu compra..." con spinner
- [ ] Aparece el mensaje de confirmación con ícono verde
- [ ] La venta se creó en Firestore con payment_id
- [ ] El estado cambió de pending (amarillo) a approved (verde)

---

## 🐛 Troubleshooting

### El webhook no se recibe

**Síntoma**: El pago queda en "pending" indefinidamente

**Soluciones**:
1. Usar el endpoint de simulación (más confiable para testing)
2. Verificar que la URL del webhook esté configurada en MercadoPago
3. Revisar logs de Cloud Functions para errores

### La venta no se crea

**Síntoma**: El pago se aprueba pero no hay venta en Firestore

**Posibles causas**:
1. El componente `ComprarComponent` no está activo
   - **Verificar**: Logs "✅ Pago aprobado recibido en ComprarComponent"
   - **Solución**: El componente padre debe permanecer montado

2. Falta información en `referenciaCompra`
   - **Verificar**: Log de error sobre referencias vacías
   - **Solución**: Asegurar que el usuario tiene productos en el carrito

3. Error en `agregarVenta()`
   - **Verificar**: Logs de error en consola
   - **Solución**: Revisar permisos de Firestore

### El listener no detecta cambios

**Síntoma**: Firestore se actualiza pero el UI no

**Soluciones**:
1. Verificar que el listener está activo: buscar log "👂 Escuchando actualizaciones"
2. Verificar que el payment_id es correcto
3. Hacer hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

---

## 🔗 URLs Importantes

- **Producción**: https://homix0523.web.app
- **Cloud Functions**: https://us-central1-homix0523.cloudfunctions.net
- **Endpoint Simulación**: https://us-central1-homix0523.cloudfunctions.net/simularAprobacionPago?payment_id=YOUR_ID
- **Firebase Console**: https://console.firebase.google.com/project/homix0523
- **MercadoPago Dashboard**: https://www.mercadopago.com.co/developers

---

## 📝 Notas Adicionales

### Diferencias PSE vs Tarjeta

| Aspecto | Tarjeta | PSE |
|---------|---------|-----|
| Token | ✅ Requerido | ❌ No usa token |
| Aprobación | Inmediata | Asíncrona (webhook) |
| Redirección | No | Sí (nueva pestaña) |
| entity_type | No | ✅ Requerido |
| financial_institution | No | ✅ Requerido |
| callback_url | No | ✅ Requerido |
| IP address | Opcional | ✅ Requerido |

### Tiempos de Procesamiento

- **Tarjeta**: < 1 segundo (sincrónico)
- **PSE (sandbox)**: 1-5 minutos (depende de simulación manual)
- **PSE (producción)**: 5-30 minutos (depende del banco)
- **PSE (endpoint testing)**: < 2 segundos (simulación instantánea)

### Limitaciones del Sandbox

- No permite finalizar el proceso en la página del banco
- A veces muestra "Algo salió mal" sin razón
- Los webhooks pueden tardar más de lo esperado
- **Recomendación**: Usar endpoint de simulación para testing

---

## 🎯 Testing Recomendado

1. **Testing Local**: Usar `simularAprobacionPago` endpoint
2. **Testing Staging**: Probar con sandbox de MercadoPago
3. **Testing Producción**: Usar cuenta de prueba real de banco

**Orden sugerido**:
1. Probar con endpoint de simulación (más rápido)
2. Verificar que todo funciona correctamente
3. Luego probar con sandbox real (opcional)
4. Finalmente, probar en producción con cuenta real

---

*Última actualización: Enero 2024*
