import api from "../lib/api";
import { BackendDashboardResponse } from "../types/dashboard";

export const dashboardService = {
  getDashboard(signal?: AbortSignal): Promise<BackendDashboardResponse> {
    return api.get("/dashboard", { signal });
  }
};
