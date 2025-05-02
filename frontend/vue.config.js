const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  
  // Configuración de la ruta base para el despliegue
  publicPath: process.env.NODE_ENV === 'production' 
    ? '/websap/' 
    : '/',
  
  // Configuración del servidor de desarrollo
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true
      }
    }
  },
  
  // Configuración para generar archivos estáticos
  outputDir: process.env.NODE_ENV === 'production' 
    ? '../public/websap' 
    : 'dist',
    
  // Configuración para el manejo de archivos HTML
  indexPath: 'index.html',
  
  // Configuración para el manejo de recursos
  assetsDir: 'assets',
});