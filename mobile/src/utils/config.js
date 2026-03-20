const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP || "192.168.1.86";
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || `http://${LOCAL_IP}:5000/api`;

const normalizedBaseUrl = RAW_API_BASE_URL
  .replace("localhost", LOCAL_IP)
  .replace("127.0.0.1", LOCAL_IP);

export const API_BASE_URL =
  normalizedBaseUrl.startsWith(`https://${LOCAL_IP}`) || normalizedBaseUrl.startsWith("https://localhost")
    ? normalizedBaseUrl.replace("https://", "http://")
    : normalizedBaseUrl;
