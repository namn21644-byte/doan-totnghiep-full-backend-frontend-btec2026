import axios from 'axios';
import { env } from '../config/env.js';

const scanServiceClient = axios.create({
  baseURL: env.scanService.baseUrl,
  timeout: env.scanService.timeoutMs
});

export const scanClientService = {
  async runScan({ scanId, target, ports, arguments: args, timeoutSeconds }) {
    const response = await scanServiceClient.post('/api/scan/run', {
      scanId,
      target,
      ports,
      arguments: args,
      timeoutSeconds
    });
    return response.data;
  },

  async cancelScan(scanId) {
    const response = await scanServiceClient.post(`/api/scan/cancel/${scanId}`);
    return response.data;
  }
};
