import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const propertyApi = {
    getAll: () => axios.get(`${API_BASE_URL}/properties`),
    create: (data: any) => axios.post(`${API_BASE_URL}/properties`, data),
};

export const agreementApi = {
    create: (data: any) => axios.post(`${API_BASE_URL}/agreements`, data),
    getByAddress: (address: string) => axios.get(`${API_BASE_URL}/agreements/${address}`),
    update: (contractAddress: string, data: any) => axios.patch(`${API_BASE_URL}/agreements/${contractAddress}`, data),
};
