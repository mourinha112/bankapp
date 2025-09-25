const axios = require('axios');

const baseUrl = process.env.ASAAS_ENVIRONMENT === 'production'
  ? 'https://www.asaas.com/api/v3'
  : 'https://sandbox.asaas.com/api/v3';

const apiKey = process.env.ASAAS_API_KEY;

const asaasApi = axios.create({
  baseURL: baseUrl,
  headers: {
    // Ambiente atual requer header access_token (mensagem de erro retornada pela API)
    'access_token': apiKey,
    'Content-Type': 'application/json',
  },
});

module.exports = asaasApi;
