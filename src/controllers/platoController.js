import { Plato } from '../models/Plato'; // Asegúrate de que la ruta sea correcta

export const crearPlato = async (req, res) => {
  try {
    const { nombre, descripcion, precio } = req.body;
    const nuevoPlato = await Plato.create({ nombre, descripcion, precio });
    res.status(201).json(nuevoPlato);
  } catch (error) {
    console.error('Error al crear el plato:', error);
    res.status(500).json({ mensaje: 'Error al crear el plato' });
  }
}; 