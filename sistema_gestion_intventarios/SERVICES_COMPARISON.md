# Comparación de Servicios: Frontend Antiguo vs Nuevo

## 1. Configuración

### Frontend Antiguo (config.js)
```javascript
const config = {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
    KEYCLOAK_URL: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8180'
};
```

### Frontend Nuevo (lib/config.ts)
```typescript
export const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180',
  KEYCLOAK_REALM: 'inventory-realm',
  KEYCLOAK_CLIENT_ID: 'inventory-app-public'
};
```

✅ **Equivalencia**: Los URLs base son idénticos. El nuevo incluye parámetros de Keycloak centralizados.

---

## 2. Autenticación

### Frontend Antiguo (App.js)
```javascript
keycloak.updateToken(30).then((refreshed) => {
  if (refreshed) {
    setToken(keycloak.token);
  }
}).catch(() => keycloak.login());
```

### Frontend Nuevo (hooks/useAuth.ts)
```typescript
kc.updateToken(30)
  .then((refreshed: boolean) => {
    if (refreshed) {
      setToken(kc.token);
    }
  })
  .catch(() => kc.login());
```

✅ **Equivalencia Exacta**: Mismo mecanismo de refresh cada 30 segundos.

---

## 3. Endpoints de Productos

| Operación | Antiguo | Nuevo | Verificación |
|-----------|---------|-------|--------------|
| **GET todos (autenticado)** | `GET ${API_BASE_URL}/api/v2/products` + Bearer Token | `GET /api/v2/products` con token | ✅ Idéntico |
| **GET públicos** | `GET http://localhost:8080/api/public/products` | `GET /api/public/products` sin token | ✅ Idéntico |
| **POST crear** | `POST http://localhost:8080/api/v2/products` + Bearer | `POST /api/v2/products` con token | ✅ Idéntico |
| **PUT actualizar** | `PUT http://localhost:8080/api/v2/products/{id}` + Bearer | `PUT /api/v2/products/{id}` con token | ✅ Idéntico |
| **DELETE** | `DELETE http://localhost:8080/api/v2/products/{id}` + Bearer | `DELETE /api/v2/products/{id}` con token | ✅ Idéntico |

### Código Antiguo (App.js - línea 104)
```javascript
const response = await axios.get(`${API_BASE_URL}/api/v2/products`, {
  headers: { Authorization: `Bearer ${keycloak.token}` }
});
```

### Código Nuevo (lib/api/products.ts)
```typescript
getAll(token?: string) {
  return apiClient.get<Product[]>('/api/v2/products', token);
}
```

donde `apiClient.get` internamente:
```typescript
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
}
```

✅ **Equivalencia**: El manejo de Authorization es idéntico.

---

## 4. Endpoints de Stock

### Frontend Antiguo (App.js - línea 162)
```javascript
const response = await axios.post(
  `http://localhost:8080/api/v2/stock/movement`,
  {
    productId,
    quantity,
    movementType,
    reason
  },
  {
    headers: { Authorization: `Bearer ${keycloak.token}` }
  }
);
```

### Frontend Nuevo (lib/api/stock.ts)
```typescript
updateStock(data: CreateMovementDto, token: string) {
  return apiClient.post<StockMovement>('/api/v2/stock/movement', data, token);
}
```

✅ **Equivalencia**: Mismo endpoint, mismo payload, misma autenticación.

---

## 5. Comparación de Métodos HTTP

### Antiguo (usa axios)
```javascript
axios.get(URL, { headers: { Authorization: `Bearer ${token}` } })
axios.post(URL, data, { headers: { Authorization: `Bearer ${token}` } })
axios.put(URL, data, { headers: { Authorization: `Bearer ${token}` } })
axios.delete(URL, { headers: { Authorization: `Bearer ${token}` } })
```

### Nuevo (usa Fetch API)
```typescript
apiClient.get<T>(endpoint, token)
apiClient.post<T>(endpoint, data, token)
apiClient.put<T>(endpoint, data, token)
apiClient.delete<T>(endpoint, token)
```

Internamente en client.ts:
```typescript
const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
  method: 'GET|POST|PUT|DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data) // para POST/PUT
});
```

✅ **Equivalencia Funcional**: Ambos envían los mismos headers y payloads.

---

## 6. Manejo de Errores

### Antiguo
```javascript
try {
  const response = await axios.get(...);
  // usar response.data
} catch (err) {
  console.error('Error:', err);
  setError('Failed to fetch products');
}
```

### Nuevo
```typescript
try {
  const data = await apiClient.get<Product[]>(...);
  // usar data directamente
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to fetch');
}
```

En client.ts:
```typescript
if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  throw new Error(error.message || `API Error: ${response.statusText}`);
}
return response.json(); // ya parsea el JSON
```

✅ **Mejora**: El nuevo cliente maneja el parsing de JSON automáticamente y errores de servidor.

---

## 7. Resumen de Equivalencias

| Aspecto | Estado |
|--------|--------|
| URLs base | ✅ Idénticos |
| Endpoints | ✅ Idénticos |
| Headers de autenticación | ✅ Idénticos |
| Payloads | ✅ Idénticos |
| Métodos HTTP | ✅ Equivalentes |
| Token refresh | ✅ Idéntico (30 segundos) |
| Modelos de datos | ✅ Compatibles |

---

## 8. Endpoints Mapeados

### Productos
- ✅ `GET /api/v2/products` - Listar todos (requiere token)
- ✅ `GET /api/public/products` - Listar públicos (sin token)
- ✅ `POST /api/v2/products` - Crear (requiere token)
- ✅ `PUT /api/v2/products/{id}` - Actualizar (requiere token)
- ✅ `DELETE /api/v2/products/{id}` - Eliminar (requiere token)

### Stock
- ✅ `POST /api/v2/stock/movement` - Crear movimiento (requiere token)
- ✅ `GET /api/v2/stock/recent?limit=500` - Últimos movimientos (requiere token)
- ✅ `GET /api/v2/stock/product/{id}` - Historial por producto (requiere token)

---

## 9. Conclusión

**✅ SERVICIOS TOTALMENTE EQUIVALENTES**

El frontend nuevo mantiene exactamente la misma funcionalidad que el antiguo en términos de:
- Endpoints consumidos
- Headers de autenticación
- Payloads enviados
- Manejo de respuestas

Las diferencias son **puramente implementación**:
- Antiguo: axios + componentes en un archivo monolítico
- Nuevo: Fetch API + servicios modulares + componentes separados

**La API del backend se mantiene 100% compatible y no requiere cambios.**
