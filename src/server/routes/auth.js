const express = require('express');
const router = express.Router();

// Datos simulados de usuarios para la autenticación
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
    email: 'admin@example.com'
  },
  {
    id: 2,
    username: 'empleado',
    password: 'empleado123',
    name: 'Empleado Demo',
    role: 'employee',
    email: 'empleado@example.com'
  },
  {
    id: 3,
    username: 'usuario',
    password: 'usuario123',
    name: 'Usuario Regular',
    role: 'user',
    email: 'usuario@example.com'
  }
];

// Ruta para login
router.post('/login', (req, res) => {
  try {
    console.log('Intento de login:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Buscar el usuario (en datos simulados)
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }    // En un sistema real, aquí generaríamos un JWT o token de sesión
    // Por simplicidad, enviamos directamente la información del usuario (sin la contraseña)
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    };

    console.log('Login exitoso para:', username);
    res.json({
      success: true,
      message: 'Login exitoso',
      user: userWithoutPassword,
      token: 'simulated-jwt-token-' + Date.now()
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor', message: error.message });
  }
});

// Ruta para verificar token (simulada)
router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token no proporcionado' });
  }
  
  // En un sistema real verificaríamos el JWT
  // Aquí solo verificamos que el token comience con nuestro prefijo
  if (token.startsWith('simulated-jwt-token-')) {
    return res.json({ valid: true });
  }
  
  res.json({ valid: false });
});

// Ruta para logout (simulada)
router.post('/logout', (req, res) => {
  // En un sistema real invalidaríamos el token
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
});

module.exports = router;