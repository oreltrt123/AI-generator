// import { createContext } from "react";

// export const UserDetailContext = createContext<any>(null);

import { createContext } from "react";

export type UserDetail = {
  credits: number;
  plan: string;
  subscriptionStatus: "active" | "inactive";
};

export type UserDetailContextType = {
  userDetail: UserDetail;
  setUserDetail: (detail: UserDetailContextType["userDetail"]) => void;
};

export const UserDetailContext = createContext<UserDetailContextType>({
  userDetail: { credits: 2, plan: "Free", subscriptionStatus: "inactive" },
  setUserDetail: () => {},
});
