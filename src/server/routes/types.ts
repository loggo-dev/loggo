import type { User, Workspace } from "../db/schema";
import type { AppDb } from "../db/types";
import type { Storage } from "../domain/storage";

export type AppEnv = {
  Variables: {
    db: AppDb;
    storage: Storage | null;
    user: User;
    workspace: Workspace;
    targetWorkspace: Workspace;
    membershipRole: "owner" | "member";
  };
};

export type AppConfig = {
  db: AppDb;
  storage: Storage | null;
  readOnly: boolean;
  maxAttachmentSize: number;
  allowedFileTypes: string[];
};
