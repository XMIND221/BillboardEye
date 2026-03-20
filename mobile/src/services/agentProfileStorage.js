import AsyncStorage from "@react-native-async-storage/async-storage";

const AGENT_PROFILE_KEY = "@billboardeye:agent-profile";

export const saveAgentProfile = async (profile) => {
  await AsyncStorage.setItem(
    AGENT_PROFILE_KEY,
    JSON.stringify({
      code: String(profile?.code || "").trim(),
      displayName: String(profile?.displayName || "").trim(),
    }),
  );
};

export const getAgentProfile = async () => {
  const raw = await AsyncStorage.getItem(AGENT_PROFILE_KEY);
  if (!raw) {
    return { code: "", displayName: "" };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      code: String(parsed?.code || "").trim(),
      displayName: String(parsed?.displayName || "").trim(),
    };
  } catch (_error) {
    return { code: "", displayName: "" };
  }
};
