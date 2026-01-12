# Solución al Problema de Redirección Fantasma en Firebase Auth

## Diagnóstico del Problema

El problema de "Redirección Fantasma" ocurre cuando:
1. El usuario inicia sesión con Google usando `signInWithRedirect`
2. Firebase redirige de vuelta a la aplicación
3. La URL debería contener parámetros como `?apiKey=...&oobCode=...&mode=signIn...`
4. Pero la URL llega limpia: `http://localhost:3010/` (sin parámetros)
5. Firebase no detecta el redirect y el usuario vuelve al login

### Causa Raíz

El problema se debe a una **configuración incorrecta** en dos lugares:

1. **Firebase Config (`authDomain`)**: Está configurado como `localhost:3010` en lugar de `tu-proyecto.firebaseapp.com`
2. **Google Cloud Console**: La URI de redirección autorizada no coincide exactamente con la URL de desarrollo

Cuando Firebase intenta redirigir a una URL que no existe (404), el servidor de desarrollo (Vite) hace un "fallback" a `index.html`, perdiendo los parámetros de la URL en el proceso.

## Solución Técnica

### 1. Verificar y Corregir `VITE_FIREBASE_AUTH_DOMAIN`

**CRÍTICO**: El `authDomain` NO debe ser `localhost`, debe ser el dominio de Firebase.

1. Abre tu archivo `.env` (o créalo desde `config/env.template`)
2. Verifica que `VITE_FIREBASE_AUTH_DOMAIN` tenga el formato correcto:

```env
# ❌ INCORRECTO (causa el problema)
VITE_FIREBASE_AUTH_DOMAIN=localhost:3010

# ✅ CORRECTO
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto-id.firebaseapp.com
```

3. Para encontrar tu `authDomain` correcto:
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto
   - Ve a **Project Settings** > **General**
   - En la sección "Your apps", busca el campo **"Authorized domains"**
   - El `authDomain` es generalmente: `tu-proyecto-id.firebaseapp.com`

### 2. Verificar y Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto de Firebase
3. Ve a **APIs & Services** > **Credentials**
4. Busca tu **OAuth 2.0 Client ID** (debe tener el tipo "Web application")
5. Haz clic para editar
6. En **"Authorized redirect URIs"**, verifica que esté exactamente:

```
http://localhost:3010
```

**IMPORTANTE**:
- Debe coincidir **exactamente** (incluyendo el puerto)
- Si usas un puerto diferente (ej: 3000), actualiza la URI
- No debe tener trailing slash: `http://localhost:3010/` ❌
- Debe ser `http://localhost:3010` ✅

7. Guarda los cambios

### 3. Verificar Configuración de Vite

El archivo `config/vite.config.js` ya está configurado con `historyApiFallback` para preservar los parámetros de la URL. Verifica que el puerto coincida:

```javascript
server: {
  port: 3000,  // Ajusta si usas otro puerto
  // ...
}
```

**Nota**: Si tu servidor corre en el puerto 3010, pero Vite está configurado para 3000, actualiza la configuración o usa el puerto correcto al iniciar el servidor.

### 4. Reiniciar el Servidor de Desarrollo

Después de cambiar las variables de entorno:

1. Detén el servidor de desarrollo (Ctrl+C)
2. Reinicia con `npm run dev`
3. Limpia la caché del navegador o usa modo incógnito
4. Intenta iniciar sesión con Google nuevamente

## Verificación

Después de aplicar los cambios, verifica en la consola del navegador:

1. **Al cargar la página después del redirect**, deberías ver:
   ```
   [AUTH] Page loaded. Checking for redirect: {
     hasRedirectParams: true,
     queryParams: { apiKey: '...', oobCode: '...', mode: 'signIn' },
     ...
   }
   ```

2. **Si ves este mensaje de error**, significa que la configuración aún está incorrecta:
   ```
   [AUTH] ⚠️ CRITICAL: User returned from Google but URL has no redirect parameters!
   ```

3. **Si todo está bien**, deberías ver:
   ```
   [AUTH] ✅ Redirect result found: { user: '...', ... }
   [AUTH] ✅ User authenticated after redirect: ...
   ```

## Mejoras Implementadas

### 1. Detección Mejorada de Parámetros de Redirect

El código ahora detecta múltiples formatos de parámetros que Firebase puede usar:
- Query params: `?apiKey=...&oobCode=...&mode=signIn...`
- Hash params: `#access_token=...&id_token=...`
- Special keys: `__firebase_request_key`

### 2. Logging Diagnóstico Mejorado

Se agregaron logs detallados que ayudan a identificar el problema:
- Estado completo de la URL (query, hash, pathname)
- Referrer para detectar si el usuario viene de Google
- Mensajes de error específicos para problemas comunes

### 3. Configuración de Vite

Se agregó `historyApiFallback` para preservar los parámetros de la URL cuando Vite hace fallback a `index.html`.

## Troubleshooting Adicional

### Si el problema persiste:

1. **Verifica que no haya errores 404 en la consola del navegador**
   - Abre DevTools > Network
   - Busca requests con status 404 durante el redirect
   - Si hay 404, verifica la configuración de `authDomain`

2. **Verifica el formato de la URL de redirect en Firebase**
   - Firebase Console > Authentication > Settings > Authorized domains
   - Asegúrate de que `localhost` esté en la lista

3. **Prueba con un dominio diferente**
   - Si estás en producción, usa el dominio real
   - Verifica que el dominio esté autorizado en Firebase Console

4. **Revisa los logs del servidor**
   - Si usas un servidor proxy, verifica que no esté modificando las URLs
   - Asegúrate de que los parámetros de query se preserven

## Referencias

- [Firebase Auth - Sign in with Redirect](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [Firebase Auth - Authorized Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#authorized-domains)
- [Google Cloud Console - OAuth 2.0](https://console.cloud.google.com/apis/credentials)

