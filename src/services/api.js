import axios from 'axios';
import API_BASE_URL from '../config';

const api = axios.create({
    baseURL: API_BASE_URL + '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Products
export const getProducts = async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
};

export const getProduct = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/products/categories/list');
    return response.data;
};

// Orders
export const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export const getOrder = async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
};

export default api;
