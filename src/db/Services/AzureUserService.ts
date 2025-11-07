import { db, AzureUser as AzureUserType } from '../QuickNotesDB';

export type AzureUser = AzureUserType;

// Create
export const addAzureUser = async (azureUser: Omit<AzureUser, 'id'>) => {
  return await db.azureUsers.add(azureUser);
};

// Read
export const getAzureUsers = async (): Promise<AzureUser[]> => {
  return await db.azureUsers.toArray();
};

// Delete
export const deleteAzureUser = async (id: number) => {
  return await db.azureUsers.delete(id);
};

