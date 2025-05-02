const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  
  // Configuración de la URL base - IMPORTANTE para el despliegue en /websap/
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
  
  // Desactivar los hashes para nombres de archivos en producción
  // Esto facilita la referencia a los archivos en el HTML
  filenameHashing: false,
  
  // Configuración para la generación de archivos de producción
  productionSourceMap: false, // Deshabilitar los sourceMap en producción
  
  // Configuración de salida
  outputDir: process.env.NODE_ENV === 'production' 
    ? 'dist' 
    : 'dist',
  
  // Configuración de CSS
  css: {
    sourceMap: process.env.NODE_ENV !== 'production',
    extract: process.env.NODE_ENV === 'production'
  },
  
  // Configuración de optimización
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    }
  }
});