export { default as ManagerCampaignsScreen } from "../../screens/ManagerCampaignsScreen";
export { default as ManagerCampaignDetailScreen } from "../../screens/ManagerCampaignDetailScreen";
export { default as ManagerCreateCampaignScreen } from "../../screens/ManagerCreateCampaignScreen";
export { default as ManagerDashboardScreen } from "../../screens/ManagerDashboardScreen";

export {
  getProjets,
  getProjetById,
  createProjet,
  updateProjet,
  deleteProjet,
  duplicateProjet,
} from "../../services/api";
