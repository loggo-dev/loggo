"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { UserSummary, WorkspaceSummary } from "@/lib/api-client";

type WorkspaceContextValue = {
  user: UserSummary;
  workspaces: WorkspaceSummary[];
  workspace: WorkspaceSummary;
  setWorkspaceId: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ user, workspaces, children }: { user: UserSummary; workspaces: WorkspaceSummary[]; children: React.ReactNode }) {
  const [workspaceId, setWorkspaceIdState] = useState(() => typeof window === "undefined" ? workspaces[0]?.id ?? "" : localStorage.getItem("loggo_workspace") ?? workspaces[0]?.id ?? "");
  const setWorkspaceId = (id: string) => { localStorage.setItem("loggo_workspace", id); setWorkspaceIdState(id); };
  const workspace = workspaces.find((candidate) => candidate.id === workspaceId) ?? workspaces[0];
  const value = useMemo(() => ({ user, workspaces, workspace, setWorkspaceId }), [user, workspaces, workspace]);
  if (!workspace) return null;
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
