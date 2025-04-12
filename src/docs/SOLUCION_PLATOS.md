# Solución para el Problema de Guardado de Platos

Para solucionar el problema de guardado de platos en la base de datos IndexedDB, se ha añadido una función auxiliar llamada `guardarPlato` en el servicio `indexedDBService.js`.

## Cómo usar la solución

1. En cualquier componente donde necesites guardar un plato, importa la función `guardarPlato`:

```javascript
import { guardarPlato } from '@/services/indexedDBService';
```

2. Reemplaza tu código actual de guardado de platos con una llamada a esta función:

```javascript
// Ejemplo: En el manejador de envío de tu formulario
const handleSubmit = async () => {
  try {
    // Los datos del formulario (asume que tienes un objeto formData o similar)
    const platoData = {
      name: this.nombre, // o formData.name, etc.
      description: this.descripcion,
      price: this.precio,
      category: this.categoria,
      is_available: this.disponible,
      image_url: this.imagen
    };
    
    // Usar la nueva función para guardar
    const platoGuardado = await guardarPlato(platoData);
    
    // Hacer algo con el plato guardado (mostrar mensaje, etc.)
    console.log('Plato guardado:', platoGuardado);
    
    // Resetear formulario, mostrar mensaje, etc.
  } catch (error) {
    console.error('Error al guardar plato:', error);
    // Manejar el error (mostrar mensaje, etc.)
  }
};
```

3. No es necesario modificar la estructura de tus componentes o formularios, simplemente reemplaza la lógica de guardado.

## Prueba Directa desde la Consola

También puedes probar el guardado directamente desde la consola del navegador:

```javascript
// Crear un plato de prueba
const platoTest = {
  name: "Plato de prueba",
  description: "Una descripción del plato",
  price: 10.99,
  category: "Categoría de prueba",
  is_available: true,
  image_url: "https://via.placeholder.com/150"
};

// Guardar el plato
guardarPlato(platoTest).then(resultado => console.log("Plato guardado:", resultado));
```

## Depuración

Si necesitas verificar que los platos se estén guardando correctamente, puedes usar la función de depuración:

```javascript
// Desde la consola del navegador
debugDB().then(data => console.log(data));
```

Esto mostrará información sobre todos los platos almacenados en la base de datos.
