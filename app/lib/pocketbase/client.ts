/**
 * PocketBase Client
 * Simple fetch-based client for PocketBase API
 */

import { getEnvConfig } from "~/config/env";
import type { BootstrapCacheRecord, ManagerPicksRecord } from "./types";

interface PocketBaseAuthResponse {
  token: string;
  admin: {
    id: string;
    email: string;
  };
}

class PocketBaseClient {
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    const config = getEnvConfig();
    this.baseUrl = config.pocketbase.url;
  }

  /**
   * Authenticate as admin
   */
  private async authenticate(): Promise<void> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
      return;
    }

    const config = getEnvConfig();
    const response = await fetch(`${this.baseUrl}/api/admins/auth-with-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identity: config.pocketbase.adminEmail,
        password: config.pocketbase.adminPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`PocketBase auth failed: ${response.status}`);
    }

    const data: PocketBaseAuthResponse = await response.json();
    this.token = data.token;
    // JWT tokens typically expire in 1 hour, set expiry
    this.tokenExpiry = Date.now() + 3600000;
  }

  /**
   * Make authenticated request to PocketBase
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.authenticate();

    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: this.token || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PocketBase request failed: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Get bootstrap cache for a gameweek
   */
  async getBootstrapCache(gameweek: number): Promise<BootstrapCacheRecord | null> {
    try {
      const result = await this.request<{ items: BootstrapCacheRecord[] }>(
        `/collections/bootstrap_cache/records?filter=(gameweek=${gameweek})&sort=-created&perPage=1`
      );
      return result.items[0] || null;
    } catch (error) {
      console.error("Failed to get bootstrap cache:", error);
      return null;
    }
  }

  /**
   * Set bootstrap cache for a gameweek
   */
  async setBootstrapCache(record: BootstrapCacheRecord): Promise<void> {
    try {
      await this.request(`/collections/bootstrap_cache/records`, {
        method: "POST",
        body: JSON.stringify(record),
      });
    } catch (error) {
      console.error("Failed to set bootstrap cache:", error);
    }
  }

  /**
   * Get manager picks for a gameweek
   */
  async getManagerPicks(
    managerId: string,
    gameweek: number
  ): Promise<ManagerPicksRecord | null> {
    try {
      const result = await this.request<{ items: ManagerPicksRecord[] }>(
        `/collections/manager_picks/records?filter=(manager_id="${managerId}"&&gameweek=${gameweek})&sort=-created&perPage=1`
      );
      return result.items[0] || null;
    } catch (error) {
      console.error("Failed to get manager picks:", error);
      return null;
    }
  }

  /**
   * Set manager picks for a gameweek
   */
  async setManagerPicks(record: ManagerPicksRecord): Promise<void> {
    try {
      await this.request(`/collections/manager_picks/records`, {
        method: "POST",
        body: JSON.stringify(record),
      });
    } catch (error) {
      console.error("Failed to set manager picks:", error);
    }
  }

  /**
   * Get all manager picks for a manager (across all gameweeks)
   */
  async getAllManagerPicks(managerId: string): Promise<ManagerPicksRecord[]> {
    try {
      const result = await this.request<{ items: ManagerPicksRecord[] }>(
        `/collections/manager_picks/records?filter=(manager_id="${managerId}")&sort=gameweek`
      );
      return result.items;
    } catch (error) {
      console.error("Failed to get all manager picks:", error);
      return [];
    }
  }
}

// Singleton instance
let pbClient: PocketBaseClient | null = null;

export function getPocketBaseClient(): PocketBaseClient {
  if (!pbClient) {
    pbClient = new PocketBaseClient();
  }
  return pbClient;
}
