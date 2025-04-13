import axios from 'axios';
import authHeader from './auth-header';
import apiConfig from '../config/apiConfig';

const API_URL = apiConfig.API_URL;

class UsuarioService {
  getUsuarios() {
    return axios.get(`${API_URL}/usuarios`, { headers: authHeader() });
  }

  getUsuario(id) {
    return axios.get(`${API_URL}/usuarios/${id}`, { headers: authHeader() });
  }

  createUsuario(usuario) {
    return axios.post(`${API_URL}/usuarios`, usuario, { headers: authHeader() });
  }

  updateUsuario(id, usuario) {
    return axios.put(`${API_URL}/usuarios/${id}`, usuario, { headers: authHeader() });
  }

  deleteUsuario(id) {
    return axios.delete(`${API_URL}/usuarios/${id}`, { headers: authHeader() });
  }
}

export default new UsuarioService();
