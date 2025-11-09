import { z } from "zod";

// Mock implementation of Astro's content collection utilities
export { z };

export function defineCollection(config: any) {
  return config;
}

export async function getCollection(collectionName: string) {
  // Mock implementation - returns empty array for tests
  return [];
}
