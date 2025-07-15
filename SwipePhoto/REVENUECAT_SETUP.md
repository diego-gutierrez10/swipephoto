# Configuración de Suscripciones con Expo IAP para SwipePhoto

## ✅ **Dependencias Instaladas**

El proyecto está configurado para usar **`expo-iap`** para compras directas con App Store y Google Play, sin intermediarios como RevenueCat.

### Dependencias Actuales:
- ✅ `expo-iap@2.5.1` - API oficial de Expo para compras in-app
- ✅ Plugin configurado en `app.json`

## 📱 **Productos de Suscripción Configurados**

Los siguientes SKUs están definidos en el código:

```typescript
const SUBSCRIPTION_SKUS = {
  WEEKLY: 'com.diegogutierrez.swipephoto.pro.Weekly',
  MONTHLY: 'com.diegogutierrez.swipephoto.pro.Monthly',
  YEARLY: 'com.diegogutierrez.swipephoto.pro.Yearly'
}
```

## 🔧 **Configuración Requerida en las Tiendas**

### **App Store Connect (iOS)**

1. **Crear Productos de Suscripción:**
   - Ve a App Store Connect > Tu App > Funciones > Compras In-App
   - Crea tres productos de suscripción con los IDs:
     - `com.diegogutierrez.swipephoto.pro.Weekly`
     - `com.diegogutierrez.swipephoto.pro.Monthly`
     - `com.diegogutierrez.swipephoto.pro.Yearly`

2. **Configurar Precios:**
   - Semanal: $1.99 USD (o equivalente)
   - Mensual: $4.99 USD (o equivalente) 
   - Anual: $29.99 USD (o equivalente - 50% descuento)

3. **Configurar Grupos de Suscripción:**
   - Crea un grupo llamado "Premium Subscription"
   - Asigna todos los productos al mismo grupo

### **Google Play Console (Android)**

1. **Crear Productos de Suscripción:**
   - Ve a Google Play Console > Tu App > Monetización > Productos > Suscripciones
   - Crea los mismos tres productos con IDs idénticos

2. **Configurar Ofertas Base:**
   - Para cada producto, crea una "Oferta Base" con precio recurrente
   - Configura períodos de prueba gratuita si deseas (7 días recomendado)

## 🧪 **Testing de Compras**

### **iOS - Sandbox Testing:**
1. Crea cuentas de prueba en App Store Connect > Usuarios y Acceso > Sandbox Testers
2. En el simulador/dispositivo, configura la cuenta de sandbox en Configuración > App Store > Cuenta Sandbox

### **Android - Testing:**
1. Sube la app a Google Play Console como "Internal Testing" o "Closed Testing"
2. Agrega cuentas de prueba en la sección de testing
3. Instala la app desde Play Store (no sideload)

## 🚀 **Build y Deploy**

### **Development Build:**
```bash
# Crear nuevo development build (requerido para expo-iap)
npx expo run:ios --device
# o
npx expo run:android --device
```

### **Configuración de Capabilities (iOS):**
- Asegúrate de que "In-App Purchase" esté habilitado en Xcode > Capabilities

### **Configuración de Permisos (Android):**
- Los permisos de billing están incluidos automáticamente con expo-iap

## 🔧 **Arquitectura del Código**

### **Servicios Principales:**
- `src/services/InAppPurchaseService.ts` - Lógica principal de compras
- `src/hooks/useSubscription.ts` - React hook para UI
- `src/screens/UpgradeScreen.tsx` - Pantalla de upgrade

### **Funcionalidades Implementadas:**
- ✅ Conexión automática a las tiendas
- ✅ Obtención de productos y precios
- ✅ Compra de suscripciones
- ✅ Restauración de compras
- ✅ Validación del estado de suscripción
- ✅ Manejo de errores y estados de carga
- ✅ Interfaz de usuario moderna

## 🔒 **Seguridad y Validación**

### **Limitaciones Actuales:**
- ⚠️ **Validación del lado del cliente únicamente**
- ⚠️ Las fechas de expiración se calculan localmente

### **Recomendaciones para Producción:**
1. **Implementar validación en el servidor:**
   - Validar receipts de iOS con Apple
   - Validar purchase tokens de Android con Google
   
2. **Backend para gestión de suscripciones:**
   - Base de datos para estados de usuario
   - Webhooks para notificaciones de renovación/cancelación
   
3. **Considerar RevenueCat para escalabilidad:**
   - Si el negocio crece, RevenueCat simplifica la gestión
   - Ofrece analytics y webhooks listos para usar

## 📝 **Notas Importantes**

1. **Expo Dev Client requerido** - expo-iap no funciona en Expo Go
2. **Testing solo en dispositivos reales** - los simuladores no procesan compras reales
3. **Bundle IDs deben coincidir** exactamente con los configurados en las tiendas
4. **Revisión de Apple/Google** requerida antes de lanzamiento

## 🛠 **Próximos Pasos**

1. **Configurar productos en App Store Connect y Google Play Console**
2. **Crear cuentas de testing en ambas plataformas**
3. **Realizar builds de desarrollo para testing**
4. **Implementar validación del lado del servidor (recomendado)**
5. **Configurar analytics para monitorear conversiones**

---

**Estado del Proyecto:** ✅ **Listo para testing en tiendas**  
**Última actualización:** Enero 2025 

# Configuración de RevenueCat para SwipePhoto

## Pasos para configurar RevenueCat

### 1. Crear cuenta en RevenueCat
1. Ve a [https://app.revenuecat.com/](https://app.revenuecat.com/)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto llamado "SwipePhoto"

### 2. Configurar la app en RevenueCat
1. En el dashboard de RevenueCat, ve a "Apps"
2. Haz clic en "Add App"
3. Selecciona "iOS" como plataforma
4. Ingresa el Bundle ID: `com.diegogutierrez.swipephoto`
5. Ingresa el nombre: "SwipePhoto"
6. Selecciona "App Store" como store

### 3. Configurar productos de suscripción
1. Ve a la sección "Products"
2. Haz clic en "Add Product"
3. Agrega los siguientes productos:
   - **Yearly**: `com.diegogutierrez.swipephoto.pro.Yearly`
   - **Monthly**: `com.diegogutierrez.swipephoto.pro.Monthly`
   - **Weekly**: `com.diegogutierrez.swipephoto.pro.Weekly`

### 4. Configurar Entitlements
1. Ve a la sección "Entitlements"
2. Crea un entitlement llamado "pro"
3. Asocia todos los productos de suscripción a este entitlement

### 5. Configurar Offerings
1. Ve a la sección "Offerings"
2. Crea un offering llamado "default"
3. Agrega los productos en el siguiente orden:
   - **Annual Package**: Yearly subscription
   - **Monthly Package**: Monthly subscription  
   - **Weekly Package**: Weekly subscription

### 6. Obtener API Key
1. Ve a la sección "API Keys"
2. Copia el "Apple API Key"
3. Reemplaza `your_revenuecat_api_key_here` en el archivo `src/services/InAppPurchaseService.ts`

### 7. Configurar en App Store Connect
1. Ve a App Store Connect
2. Crea los productos de suscripción con los mismos IDs:
   - `com.diegogutierrez.swipephoto.pro.Yearly` - $29.99/año
   - `com.diegogutierrez.swipephoto.pro.Monthly` - $8.99/mes
   - `com.diegogutierrez.swipephoto.pro.Weekly` - $2.99/semana

### 8. Configurar archivo .env (opcional)
Crea un archivo `.env` en la raíz del proyecto SwipePhoto con:
```
REVENUECAT_API_KEY_IOS=tu_api_key_aqui
```

### 9. Configurar webhooks (opcional)
Si quieres recibir notificaciones de eventos de suscripción:
1. Ve a "Integrations" > "Webhooks"
2. Configura la URL de tu servidor backend
3. Selecciona los eventos que quieres recibir

## Estructura de archivos modificados

```
SwipePhoto/
├── src/
│   ├── services/
│   │   └── InAppPurchaseService.ts (actualizado para RevenueCat)
│   └── hooks/
│       └── useInAppPurchases.ts (actualizado)
├── .env (opcional)
└── REVENUECAT_SETUP.md (este archivo)
```

## Beneficios de RevenueCat

1. **Dashboard analítico**: Ve métricas de suscripciones, retención, ingresos
2. **Gestión de usuarios**: Sigue el ciclo de vida de cada suscriptor
3. **Webhooks**: Recibe notificaciones de eventos en tiempo real
4. **Compatibilidad**: Funciona con versiones anteriores de Xcode
5. **Validación de recibos**: Maneja automáticamente la validación
6. **Gestión de renovaciones**: Detecta automáticamente renovaciones y cancelaciones

## Próximos pasos

1. Configurar RevenueCat siguiendo esta guía
2. Reemplazar el API key en el código
3. Probar las suscripciones en modo sandbox
4. Configurar el backend para webhooks (opcional)
5. Lanzar en producción

## Soporte

- Documentación de RevenueCat: [https://docs.revenuecat.com/](https://docs.revenuecat.com/)
- Guía de iOS: [https://docs.revenuecat.com/docs/ios](https://docs.revenuecat.com/docs/ios)
- React Native: [https://docs.revenuecat.com/docs/react-native](https://docs.revenuecat.com/docs/react-native) 