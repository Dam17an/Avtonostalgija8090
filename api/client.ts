const BASE_URL = ''; // Base URL for the Strapi API (e.g., http://localhost:1337)

export const apiFetch = async (endpoint: string, defaultValue: any = null) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      // Return default value instead of throwing to handle cases where the backend is not yet ready
      return defaultValue;
    }
    const result = await response.json();
    // Handle Strapi's { data: [...] } structure or direct arrays
    return result.data || result;
  } catch (error) {
    // Return default value on network errors or parsing failures
    return defaultValue;
  }
};