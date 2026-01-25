import {
  setThirdPartyAccount,
  getThirdPartyAccount,
} from "../db/Services/ThirdPartyAccountService";
import { ThirdPartyAccount } from "../db/QuickNotesDB";
import { useContext } from "react";
import { ConfirmModalContext } from "../App";

// returns true if third party account was set
export async function handleSetThirdPartyAccount(
  newThirdPartyAccount: ThirdPartyAccount
): Promise<boolean> {
  const confirmModal = useContext(ConfirmModalContext);

  const currentThirdPartyAccount = await getThirdPartyAccount();

  // if there is no current account, add new account
  if (!currentThirdPartyAccount) {
    setThirdPartyAccount(newThirdPartyAccount);
    return true; //set new third party account
  }

  // if the thirdPartyUserId is undefined, always ask if the user is ok replacing it
  if (currentThirdPartyAccount.thirdPartyUserId === undefined) {
    confirmModal?.showConfirm(
      "Override Synced Account",
      `A ${currentThirdPartyAccount.accountType} account connection with UserId: currently exists. Would you like to replace it with a ${newThirdPartyAccount.accountType} account connection with auth type: ${newThirdPartyAccount.authMethod}?`,
      () => {
        setThirdPartyAccount(newThirdPartyAccount);
        return true; //updated third party account
      },
    );
  }

  // If the exact account exists, silently continue
  // this allows the user to update thier PAT
  if (
    currentThirdPartyAccount.accountType === newThirdPartyAccount.accountType &&
    currentThirdPartyAccount.authMethod === newThirdPartyAccount.authMethod &&
    currentThirdPartyAccount.thirdPartyUserId ===
      newThirdPartyAccount.thirdPartyUserId
  ) {
    return true; // Continue without add or udpate to allow cases such as update PAT
  }

  // If an account exists with the same account type and user ID, ask if the user wants to replace the auth type
  else if (
    currentThirdPartyAccount.accountType === newThirdPartyAccount.accountType &&
    currentThirdPartyAccount.thirdPartyUserId ===
      newThirdPartyAccount.thirdPartyUserId
  ) {
    confirmModal?.showConfirm(
      "Override Authentication Type",
      `This ${currentThirdPartyAccount.accountType} account connection with UserId: ${currentThirdPartyAccount.thirdPartyUserId} already exists. Would you like to replace the auth type from ${currentThirdPartyAccount.authMethod} to ${newThirdPartyAccount.authMethod}?`,
      () => {
        setThirdPartyAccount(newThirdPartyAccount);
        return true; //updated third party account
      },
    );
  }

  // If the user entered in a new account, ask if they want to override their old one
  else {
    confirmModal?.showConfirm(
      "Override Synced Account",
      `A ${currentThirdPartyAccount.accountType} account connection with UserId: ${currentThirdPartyAccount.thirdPartyUserId} currently exists. Would you like to replace it with a ${newThirdPartyAccount.accountType} account connection with UserId: ${newThirdPartyAccount.thirdPartyUserId} and auth type: ${newThirdPartyAccount.authMethod}?`,
      () => {
        setThirdPartyAccount(newThirdPartyAccount);
        return true; //updated third party account
      },
    );
  }
  return false; // Did not add or update the third party account
}

// // returns true if third party account was set
// export async function getAzureDevopsUserId(
//   newThirdPartyAccount: ThirdPartyAccount
// ): Promise<boolean> {
//   const currentThirdPartyAccount = await getThirdPartyAccount();

//   // if there is no current account, add new account
//   if (!currentThirdPartyAccount) {
//     setThirdPartyAccount(newThirdPartyAccount);
//     return true; //set new third party account
//   }

//   //if third party account id is undefined, that means that the user never syned work items down
//   //We are ok with just warning the user that their third party connection will be replaced
//   if (currentThirdPartyAccount.thirdPartyUserId === undefined)
//   {
//     const isConfirmed = window.confirm(
//         `A ${currentThirdPartyAccount.accountType} account connection currently exists. Would you like to replace it with a new ${newThirdPartyAccount.accountType} account connection with UserId: ${newThirdPartyAccount.thirdPartyUserId} and auth type: ${newThirdPartyAccount.authMethod}?`
//     );

//     if (isConfirmed) {
//         setThirdPartyAccount(newThirdPartyAccount);
//         return true; //updated third party account to a new type or userId
//     }
//   }

//   // If the exact account exists, silently continue
//   // this allows the user to update thier PAT
//   if (
//     currentThirdPartyAccount.accountType === newThirdPartyAccount.accountType &&
//     currentThirdPartyAccount.authMethod === newThirdPartyAccount.authMethod &&
//     currentThirdPartyAccount.thirdPartyUserId ===
//       newThirdPartyAccount.thirdPartyUserId
//   ) {
//     return true; // Continue without add or udpate to allow cases such as update PAT
//   }

//   // If an account exists with the same account type and user ID, ask if the user wants to replace the auth type
//   else if (
//     currentThirdPartyAccount.accountType === newThirdPartyAccount.accountType &&
//     currentThirdPartyAccount.thirdPartyUserId ===
//       newThirdPartyAccount.thirdPartyUserId
//   ) {
//     const isConfirmed = window.confirm(
//       `This ${currentThirdPartyAccount.accountType} account connection with UserId: ${currentThirdPartyAccount.thirdPartyUserId} already exists. Would you like to replace the auth type from ${currentThirdPartyAccount.authMethod} to ${newThirdPartyAccount.authMethod}?`
//     );

//     if (isConfirmed) {
//       setThirdPartyAccount(newThirdPartyAccount);
//       return true; //updated third party account's auth type
//     }
//   }

//   // If the user entered in a new account, ask if they want to override their old one
//   else {
//     const isConfirmed = window.confirm(
//         `A ${currentThirdPartyAccount.accountType} account connection with UserId: ${currentThirdPartyAccount.thirdPartyUserId} already exists. Would you like to replace it with a ${newThirdPartyAccount.accountType} account connection with UserId: ${newThirdPartyAccount.thirdPartyUserId} and auth type: ${newThirdPartyAccount.authMethod}?`
//     );

//     if (isConfirmed) {
//         setThirdPartyAccount(newThirdPartyAccount);
//         return true; //updated third party account to a new type or userId
//     }
//   }
//   return false; // Did not add or update the third party account
// }