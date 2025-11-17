# 🥖 Gestión de Panadería - Aplicación Web

Una aplicación web completa para gestionar ingresos, egresos y análisis financiero de una panadería.

## 📋 Características

### 1. **Dashboard**
- Vista general del día
- Métricas de ingresos y egresos del día
- Ganancia neta diaria
- Total del mes
- Gráfico doughnut de ingresos vs egresos

### 2. **Módulo de Registros**
- Registrar ingresos y egresos diarios
- Categorías personalizables
- Descripción opcional de cada movimiento
- Filtros por fecha, tipo y categoría
- Tabla con registro histórico de transacciones
- Opción de eliminar registros

### 3. **Módulo de Parámetros**
- **Gestionar Categorías**: Agregar y eliminar categorías de ingresos y egresos
- **Gestionar Tipos**: Visualizar tipos disponibles (Ingresos/Egresos)
- Protección de integridad: No permite eliminar categorías con registros activos

### 4. **Módulo de Análisis**
- **Filtro de período**: Seleccionar rango de fechas
- **Estadísticas**: Total ingresos, egresos, ganancia neta, promedio diario
- **Gráficos**:
  - Comparación Ingresos vs Egresos (gráfico de barras)
  - Distribución por Categoría (gráfico de pastel)
  - Tendencia Diaria (gráfico de líneas)
- **Tabla de Detalle**: Análisis por categoría con cantidad, total y promedio

## 🚀 Cómo usar

### Instalación
1. Descarga los archivos en una carpeta
2. Abre `index.html` en tu navegador web

### Primeros pasos
1. Ve a la sección **Parámetros** para crear tus categorías personalizadas
2. Usa el módulo **Registros** para registrar tus movimientos diarios
3. Visualiza métricas en el **Dashboard**
4. Analiza tus datos en la sección **Análisis**

## 📁 Estructura de archivos

```
App Panaderia/
├── index.html       # Página principal (estructura HTML)
├── styles.css       # Estilos y diseño
├── app.js          # Lógica de la aplicación
└── README.md       # Este archivo
```

## 💾 Almacenamiento

Los datos se guardan automáticamente en **LocalStorage** del navegador:
- Todos los registros se persisten en el navegador
- Los datos se recuperan al recargar la página
- No requiere servidor backend

## 🎨 Diseño

- **Tema**: Colores cálidos (café y tonos tierra) - perfecto para panadería
- **Responsive**: Se adapta a dispositivos móviles y desktop
- **Interfaz intuitiva**: Fácil navegación entre módulos

## 📊 Categorías Predefinidas

### Ingresos
- Ventas al mostrador
- Ventas al por mayor
- Otros ingresos

### Egresos
- Materia prima
- Servicios (luz, agua, gas)
- Salarios
- Mantenimiento
- Otros egresos

*Puedes agregar más categorías personalizadas en el módulo de Parámetros*

## 🔍 Ejemplos de uso

### Registrar una venta matutina
1. Ve a **Registros**
2. Tipo: Ingreso
3. Categoría: Ventas al mostrador
4. Descripción: Venta matutina
5. Monto: 150.00
6. Fecha: Hoy
7. Click en "Guardar Registro"

### Registrar gasto de materia prima
1. Ve a **Registros**
2. Tipo: Egreso
3. Categoría: Materia prima
4. Descripción: Compra de harina
5. Monto: 50.00
6. Fecha: Hoy
7. Click en "Guardar Registro"

### Analizar datos del mes
1. Ve a **Análisis**
2. Establece la fecha de inicio (primer día del mes)
3. Establece la fecha de fin (hoy)
4. Click en "Actualizar"
5. Visualiza gráficos y estadísticas

## 🛠️ Tecnologías usadas

- HTML5
- CSS3 (Grid, Flexbox)
- JavaScript (Vanilla)
- Chart.js v4.4.0 (para gráficos)
- LocalStorage API (para almacenamiento)

## ⚙️ Configuración técnica

No requiere configuración especial. Solo abre el archivo `index.html` en cualquier navegador moderno (Chrome, Firefox, Edge, Safari).

## 🐛 Solución de problemas

**Problema**: Los datos desaparecen después de cerrar el navegador
**Solución**: Esto es normal. LocalStorage persiste mientras no borres datos del navegador. Para hacer datos permanentes, necesitarías un backend.

**Problema**: Las gráficas no aparecen
**Solución**: Asegúrate de que tienes conexión a Internet para cargar Chart.js desde CDN.

## 📝 Notas

- Todos los datos son locales a tu navegador
- Para compartir datos entre dispositivos, necesitarías un servidor backend
- Hacer backup: Puedes exportar datos desde la consola del navegador (F12)

## 👨‍💻 Desarrollo futuro

Mejoras posibles:
- Exportar a Excel/PDF
- Sincronización en la nube
- Autenticación de usuarios
- Reportes personalizados
- Integración con métodos de pago

---

**¡Disfruta gestionando tu panadería!** 🥖
