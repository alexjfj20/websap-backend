// backend/controllers/platoController.js

const Plato = require('../models/Plato');
const Restaurante = require('../models/Restaurante'); // Añadir importación para el modelo Restaurante

// Obtener todos los platos
exports.getPlatos = async (req, res) => {
  try {
    console.log('Solicitud para obtener todos los platos');
    const platos = await Plato.findAll();
    console.log(`Obtenidos ${platos.length} platos`);
    res.status(200).json(platos);
  } catch (error) {
    console.error('Error al obtener platos:', error);
    res.status(500).json({ message: 'Error al obtener platos', error: error.message });
  }
};

// Obtener un plato por ID
exports.getPlatoById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Solicitud para obtener plato ID ${id}`);
    
    const plato = await Plato.findByPk(id);
    
    if (!plato) {
      console.log(`Plato ID ${id} no encontrado`);
      return res.status(404).json({ message: 'Plato no encontrado' });
    }
    
    console.log(`Plato ID ${id} encontrado`);
    res.status(200).json(plato);
  } catch (error) {
    console.error(`Error al obtener plato ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener plato', error: error.message });
  }
};

// Crear un nuevo plato
exports.createPlato = async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body;
    
    console.log('Solicitud para crear nuevo plato:', req.body);
    
    // Validaciones básicas
    if (!name) {
      return res.status(400).json({ message: 'El nombre del plato es obligatorio' });
    }
    
    if (price === undefined || price === null) {
      return res.status(400).json({ message: 'El precio del plato es obligatorio' });
    }
    
    const nuevoPlato = await Plato.create({
      name,
      description: description || '',
      price: parseFloat(price),
      category: category || 'general',
      image_url: image_url || null,
      is_available: is_available !== undefined ? is_available : true
    });
    
    console.log('Nuevo plato creado:', nuevoPlato.toJSON());
    res.status(201).json(nuevoPlato);
  } catch (error) {
    console.error('Error al crear plato:', error);
    res.status(500).json({ message: 'Error al crear plato', error: error.message });
  }
};

// Actualizar un plato
exports.updatePlato = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;
    
    console.log(`Solicitud para actualizar plato ID ${id}:`, req.body);
    
    const plato = await Plato.findByPk(id);
    
    if (!plato) {
      console.log(`Plato ID ${id} no encontrado para actualizar`);
      return res.status(404).json({ message: 'Plato no encontrado' });
    }
    
    // Actualizar campos
    if (name !== undefined) plato.name = name;
    if (description !== undefined) plato.description = description;
    if (price !== undefined) plato.price = parseFloat(price);
    if (category !== undefined) plato.category = category;
    if (image_url !== undefined) plato.image_url = image_url;
    if (is_available !== undefined) plato.is_available = is_available;
    
    await plato.save();
    
    console.log(`Plato ID ${id} actualizado correctamente`);
    res.status(200).json(plato);
  } catch (error) {
    console.error(`Error al actualizar plato ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar plato', error: error.message });
  }
};

// Eliminar un plato
exports.deletePlato = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Solicitud para eliminar plato ID ${id}`);
    
    const plato = await Plato.findByPk(id);
    
    if (!plato) {
      console.log(`Plato ID ${id} no encontrado para eliminar`);
      return res.status(404).json({ message: 'Plato no encontrado' });
    }
    
    await plato.destroy();
    
    console.log(`Plato ID ${id} eliminado correctamente`);
    res.status(200).json({ message: 'Plato eliminado correctamente' });
  } catch (error) {
    console.error(`Error al eliminar plato ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar plato', error: error.message });
  }
};

// Obtener platos por ID de menú (para menús compartidos)
// Esta función no devuelve una respuesta HTTP, solo los platos
exports.getPlatosByMenuId = async (menuId) => {
  try {
    console.log(`Buscando platos para el menú ID ${menuId}`);
    
    // Intentar diferentes estrategias para encontrar platos relacionados con este menuId
    
    // Opción 1: Si menuId es en realidad el ID de un restaurante
    let platos = await Plato.findAll({
      where: { restaurante_id: menuId },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    if (platos && platos.length > 0) {
      console.log(`Encontrados ${platos.length} platos para restaurante_id=${menuId}`);
      return platos.map(plato => ({
        id: plato.id,
        name: plato.name,
        description: plato.description || '',
        price: parseFloat(plato.price || 0),
        category: plato.category || 'General',
        image: plato.image_url,
        isSpecial: Boolean(plato.is_special),
        isAvailable: plato.is_available !== false,
        availableQuantity: plato.available_quantity
      }));
    }
    
    // Opción 2: Si menuId es un ID específico para un menú guardado
    platos = await Plato.findAll({
      where: { menu_id: menuId },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    if (platos && platos.length > 0) {
      console.log(`Encontrados ${platos.length} platos para menu_id=${menuId}`);
      return platos.map(plato => ({
        id: plato.id,
        name: plato.name,
        description: plato.description || '',
        price: parseFloat(plato.price || 0),
        category: plato.category || 'General',
        image: plato.image_url,
        isSpecial: Boolean(plato.is_special),
        isAvailable: plato.is_available !== false,
        availableQuantity: plato.available_quantity
      }));
    }

    // Opción 3: Si menuId es un ID compartido externo
    // Por ejemplo, si los menús compartidos se guardan en otra tabla con su propio ID
    // Aquí se podría implementar la lógica para buscar en esa tabla
    
    // Si llegamos aquí, no encontramos ningún plato asociado a este menuId
    console.log(`No se encontraron platos para el menuId ${menuId} con ninguna estrategia`);
    return [];
    
  } catch (error) {
    console.error(`Error al buscar platos para menuId ${menuId}:`, error);
    throw error; // Re-lanzar el error para que lo maneje el llamador
  }
};

// Obtener información del negocio por ID de menú (para menús compartidos)
// Esta función no devuelve una respuesta HTTP, solo la información del negocio
exports.getBusinessInfoByMenuId = async (menuId) => {
  try {
    console.log(`Buscando información del negocio para el menú ID ${menuId}`);
    
    // Opción 1: Si menuId es en realidad el ID de un restaurante, obtener directamente
    let restaurante = await Restaurante.findByPk(menuId);
    
    if (restaurante) {
      console.log(`Encontrado restaurante con ID=${menuId}`);
      return formatRestauranteToBusinessInfo(restaurante);
    }
    
    // Opción 2: Si menuId es un ID específico para un menú guardado,
    // buscar un plato que tenga este menu_id y obtener su restaurante_id
    const plato = await Plato.findOne({ 
      where: { menu_id: menuId },
      attributes: ['restaurante_id']
    });
    
    if (plato && plato.restaurante_id) {
      console.log(`Encontrado plato con menu_id=${menuId}, restaurante_id=${plato.restaurante_id}`);
      restaurante = await Restaurante.findByPk(plato.restaurante_id);
      
      if (restaurante) {
        return formatRestauranteToBusinessInfo(restaurante);
      }
    }
    
    // Opción 3: Intentar buscar directamente por el campo id_compartido si existe
    restaurante = await Restaurante.findOne({
      where: { id_compartido: menuId }
    });
    
    if (restaurante) {
      console.log(`Encontrado restaurante con id_compartido=${menuId}`);
      return formatRestauranteToBusinessInfo(restaurante);
    }
    
    // Si no encontramos información del negocio, retornar información predeterminada
    console.log(`No se encontró información de negocio para menuId=${menuId}`);
    return {
      name: 'Restaurante WebSAP',
      description: 'Menú compartido',
      address: '',
      contact: '',
      logo: null,
      paymentInfo: {
        qrImage: null,
        qrTitle: 'Información de pago',
        nequiNumber: null,
        nequiImage: null,
        bankInfo: '',
        otherPaymentMethods: ''
      }
    };
    
  } catch (error) {
    console.error(`Error al buscar información del negocio para menuId=${menuId}:`, error);
    throw error;
  }
};

// Función auxiliar para formatear un restaurante como información de negocio
function formatRestauranteToBusinessInfo(restaurante) {
  // Extraer la información de pago del campo JSON (si existe)
  let paymentInfo = {
    qrImage: null,
    qrTitle: 'Información de pago',
    nequiNumber: null,
    nequiImage: null,
    bankInfo: '',
    otherPaymentMethods: ''
  };
  
  try {
    if (restaurante.informacion_pago) {
      paymentInfo = JSON.parse(restaurante.informacion_pago);
    }
  } catch (error) {
    console.warn('Error al parsear información_pago:', error);
  }
  
  return {
    name: restaurante.nombre || 'Restaurante WebSAP',
    description: restaurante.descripcion || 'Menú compartido',
    address: restaurante.direccion || '',
    contact: restaurante.telefono || '',
    email: restaurante.email || '',
    hours: restaurante.horario || '',
    logo: restaurante.logo || null,
    paymentInfo
  };
}