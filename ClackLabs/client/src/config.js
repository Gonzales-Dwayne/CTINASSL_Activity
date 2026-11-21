export const DATA_SOURCE = (
  import.meta.env.VITE_DATA_SOURCE || 'mongodb'
).toLowerCase();

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');
