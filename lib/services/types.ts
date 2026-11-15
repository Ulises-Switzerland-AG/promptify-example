import "server-only";

export type CurrentUser = {
  oid: string;
  name: string;
  isAdministrator: boolean;
};
