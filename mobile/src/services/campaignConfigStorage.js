import AsyncStorage from "@react-native-async-storage/async-storage";

const CAMPAIGN_CONFIG_KEY = "@billboardeye:campaign-config";

const readConfig = async () => {
  const raw = await AsyncStorage.getItem(CAMPAIGN_CONFIG_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return {};
  }
};

const writeConfig = async (value) => {
  await AsyncStorage.setItem(CAMPAIGN_CONFIG_KEY, JSON.stringify(value || {}));
};

export const saveCampaignConfig = async (projectId, config) => {
  if (!projectId) {
    return;
  }
  const current = await readConfig();
  current[projectId] = {
    clientLogoUri: config?.clientLogoUri || "",
    companyLogoUri: config?.companyLogoUri || "",
    primaryColor: config?.primaryColor || "#2563EB",
    reportTitle: config?.reportTitle || "",
    instructions: config?.instructions || "",
    duration: config?.duration || "",
  };
  await writeConfig(current);
};

export const getCampaignConfig = async (projectId) => {
  if (!projectId) {
    return null;
  }
  const current = await readConfig();
  return current[projectId] || null;
};
