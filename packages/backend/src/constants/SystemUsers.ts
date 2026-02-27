export type SystemUserType = "api_key" | "scheduler";

export type SystemUser = {
  id: string;
  name: string;
  type: SystemUserType;
};

export const SYSTEM_USER_IDS = {
  API_KEY: "api-key-user",
  AUTO_ARCHIVE: "system-auto-archive",
} as const;

export const SYSTEM_USERS: SystemUser[] = [
  {
    id: SYSTEM_USER_IDS.API_KEY,
    name: "API Key",
    type: "api_key",
  },
  {
    id: SYSTEM_USER_IDS.AUTO_ARCHIVE,
    name: "系統排程",
    type: "scheduler",
  },
];

export function getSystemUserById(id: string) {
  return SYSTEM_USERS.find((user) => user.id === id);
}
