import axios from 'axios';

export const apiClient = axios.create({
  baseURL: `${import.meta.env.BASE_URL}mock/`,
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

export const toFriendlyError = (error) => {
  if (error?.friendly) return error;
  let message = 'Terjadi kesalahan tak terduga. Silakan coba lagi.';
  if (error?.code === 'ECONNABORTED' || error?.name === 'AbortError') {
    message = 'Permintaan terlalu lama. Periksa koneksi internet Anda lalu coba lagi.';
  } else if (error?.response) {
    message = `Server menjawab dengan galat ${error.response.status}. Silakan coba lagi nanti.`;
  } else if (error?.request || error instanceof TypeError) {
    message = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  } else if (error?.message) {
    message = error.message;
  }
  const friendly = new Error(message);
  friendly.friendly = true;
  return friendly;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toFriendlyError(error)),
);

export const fetchJson = async (url, { timeout = 8000, signal } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  signal?.addEventListener('abort', () => controller.abort());
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Server menjawab dengan galat ${response.status}.`);
    return await response.json();
  } catch (error) {
    throw toFriendlyError(error);
  } finally {
    clearTimeout(timer);
  }
};
