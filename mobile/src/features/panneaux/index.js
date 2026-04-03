export { default as ManagerPanneauxScreen } from "../../screens/ManagerPanneauxScreen";
export { default as ManagerPanneauxMapScreen } from "../../screens/ManagerPanneauxMapScreen";
export { default as ManagerPanneauFormScreen } from "../../screens/ManagerPanneauFormScreen";
export { default as AgentPanneauxScreen } from "../../screens/AgentPanneauxScreen";
export { default as UploadPanneauScreen } from "../../screens/UploadPanneauScreen";

export {
  getPanneaux,
  createPanneau,
  updatePanneau,
  deletePanneau,
  getRapport,
  addPhoto,
} from "../../services/api";
