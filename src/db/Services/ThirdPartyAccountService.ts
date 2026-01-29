import { db, ThirdPartyAccount as ThirdPartyAccountType } from '../QuickNotesDB';

export type ThirdPartyAccount = ThirdPartyAccountType;

// Create / Update
// if an account already exists, update its values to the new account, otherwise add new account
// This ensures that only 1 ThirdPartyAccount will exist
export const setThirdPartyAccount = async (account: Omit<ThirdPartyAccount, 'id'>) => {
  const accountAlreadyExists = await db.thirdPartyAccount.toCollection().first();

  if (accountAlreadyExists) {
    return await db.thirdPartyAccount.put({...accountAlreadyExists, id: accountAlreadyExists.id});
  }
  else {
    return await db.thirdPartyAccount.add(account)
  }
};

export const updateLastSyncedAtDate = async () => {
  const currentThirdPartyAccount = await getThirdPartyAccount();
  if (!currentThirdPartyAccount?.id) return;

  const now = new Date() // updates the lastSyncedDate and returns that date
  await db.thirdPartyAccount.update(currentThirdPartyAccount.id, {lastSyncedAt: now})
  return now;
}

export const recoverNote = async (id: number) => {
  return await db.notes.update(id, { softDeleted: false });
}

// Read
export const getThirdPartyAccount = async (): Promise<ThirdPartyAccount | undefined> => {
  return await db.thirdPartyAccount.toCollection().first();
};

// Delete
export const deleteThirdPartyAcount = async () => {
  const existingAccount = await getThirdPartyAccount();

  if (existingAccount) {
    return await db.thirdPartyAccount.delete(existingAccount.id!);
  }
}

