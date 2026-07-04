import api from "../lib/api";
import { ConfigResponseData } from "../types/config";

export const configService = {
  getConfig(signal?: AbortSignal): Promise<ConfigResponseData> {
    return api.get("/config", { signal });
  }
};
