import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Authentication } from '@/core/Authentication';
import { Logger } from '@/logging/Logger';
import * as Types from './types';

/**
 * ServidoresClient - Auto-generated client for Portal da Transparência API
 * Base URL: https://api.portaldatransparencia.gov.br
 */
export class ServidoresClient {
  private axiosInstance: AxiosInstance;
  private auth: Authentication;
  private logger: Logger;

  constructor(auth: Authentication, logger: Logger, baseURL: string = 'https://api.portaldatransparencia.gov.br') {
    this.auth = auth;
    this.logger = logger;
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const authHeaders = this.auth.getAuthHeaders();
        Object.assign(config.headers, authHeaders);
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', { error });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.info('API request successful', {
          method: response.config.method,
          url: response.config.url,
          status: response.status
        });
        return response;
      },
      (error) => {
        this.logger.error('API request failed', {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all servers
   
   
   
   
   * @returns Promise<AxiosResponse<any>>
   */
  async getServidores(): Promise<AxiosResponse<any>> {
    const path = '/servidores';
    
    const url = path;

    return this.axiosInstance.truefalsefalsefalsefalse(url);
  }

}


