from PIL import Image
import os

# Ruta del archivo
logo_path = r"f:\Mi unidad\Programacion\App Panaderia\logo.jpg"

# Abrir la imagen
img = Image.open(logo_path)

# Obtener dimensiones originales
print(f"Dimensiones originales: {img.size}")
print(f"Tamaño original: {os.path.getsize(logo_path) / 1024:.2f} KB")

# Optimizar la imagen
# Redimensionar si es muy grande (máximo 400px de ancho para un logo)
if img.width > 400:
    ratio = 400 / img.width
    new_size = (400, int(img.height * ratio))
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    print(f"Nuevas dimensiones: {img.size}")

# Guardar la imagen optimizada con compresión
img.save(logo_path, 'JPEG', quality=85, optimize=True)

# Verificar nuevo tamaño
new_size_kb = os.path.getsize(logo_path) / 1024
print(f"Tamaño optimizado: {new_size_kb:.2f} KB")
print(f"Compresión: {((1 - new_size_kb/144.76) * 100):.1f}%")
print("✅ Imagen optimizada correctamente")
