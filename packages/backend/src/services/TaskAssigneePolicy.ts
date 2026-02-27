import { SYSTEM_USERS } from "@backend/constants/SystemUsers";

const SYSTEM_USER_ID_SET = new Set(SYSTEM_USERS.map((user) => user.id));

export function applyTaskCreateAssigneePolicy(args: {
  assigneeIds: string[];
  requesterId: string;
}) {
  const nextAssigneeIds = [...args.assigneeIds];
  if (!SYSTEM_USER_ID_SET.has(args.requesterId)) {
    nextAssigneeIds.push(args.requesterId);
  }
  return [...new Set(nextAssigneeIds)];
}
