import { hc } from "hono/client";
import type { AppType } from "@/server/app";
import type { UserColor } from "@/lib/user-colors";
import type { WorkspaceColor, WorkspaceIconName } from "@/lib/workspace-appearance";

export type UserSummary = { id: string; email: string; name: string; color: UserColor; role: "admin" | "user"; disabledAt?: string | null; createdAt?: string };
export type WorkspaceSummary = { id: string; slug: string; name: string; color: WorkspaceColor; icon: WorkspaceIconName; kind: "personal" | "shared"; role?: "owner" | "member"; templateMode?: "today_only" | "any_visited_day" };
export type AdminWorkspaceSummary = { workspace: WorkspaceSummary; members: { userId: string; role: string }[] };
export type LogSummary = { id: string; workspaceId: string; authorId: string; authorName: string; day: string; title: string | null; body: string; createdAt: string; updatedAt: string; tags: string[]; mirrorDirty: boolean; posX: number | null; posY: number | null; width: number | null; height: number | null; zIndex: number };
export type LogDetail = Omit<LogSummary, "authorName"> & { author: { id: string; name: string }; workspace: { id: string; slug: string; name: string }; tasks: TaskSummary[] };
export type TaskSummary = { id: string; logId: string; text: string; done: boolean; dueDate: string | null; lineNo: number; completedAt: string | null; logTitle?: string | null; day?: string };
export type TagSummary = { id: string; name: string; count: number };
export type TemplateSummary = { id: string; workspaceId: string; title: string | null; body: string; enabled: boolean; createdAt: string };
export type AttachmentSummary = { attachment: { id: string; logId: string; filename: string; mime: string; size: number; createdAt: string }; logTitle: string | null; day: string };
export type SearchResult = { type: "log" | "tag" | "task"; id: string; title: string; snippet: string; day: string | null };

export const apiClient = hc<AppType>(typeof window === "undefined" ? "http://localhost" : window.location.origin);

async function readJson<T>(response: { ok: boolean; json(): Promise<unknown> }): Promise<T> {
  const body = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? "Request failed");
  return body;
}

export const api = {
  setupStatus: async () => readJson<{ needed: boolean }>(await apiClient.api.setup.status.$get()),
  setup: async (values: { name: string; email: string; password: string }) => readJson<{ user: UserSummary; workspace: WorkspaceSummary }>(await apiClient.api.setup.$post({ json: values })),
  login: async (values: { email: string; password: string }) => readJson<{ user: UserSummary }>(await apiClient.api.auth.login.$post({ json: values })),
  logout: async () => readJson<{ ok: true }>(await apiClient.api.auth.logout.$post()),
  me: async () => readJson<{ user: UserSummary; workspaces: WorkspaceSummary[] }>(await apiClient.api.auth.me.$get()),
  updateProfile: async (values: { name: string; color?: UserColor; password?: string }) => readJson<{ ok: true }>(await apiClient.api.profile.$patch({ json: values })),
  logs: async (workspaceId: string, query: { day?: string; from?: string; to?: string; tag?: string; page?: string | number } = {}) => readJson<{ logs: LogSummary[]; hasMore: boolean; page: number; limit: number }>(await apiClient.api.workspaces[":workspaceId"].logs.$get({ param: { workspaceId }, query: { ...query, page: query.page?.toString() } })),
  log: async (workspaceId: string, logId: string) => readJson<LogDetail>(await apiClient.api.workspaces[":workspaceId"].logs[":logId"].$get({ param: { workspaceId, logId } })),
  createLog: async (workspaceId: string, values: { day: string; title?: string | null; body: string; posX?: number; posY?: number }) => readJson<LogDetail>(await apiClient.api.workspaces[":workspaceId"].logs.$post({ param: { workspaceId }, json: values })),
  updateLog: async (workspaceId: string, logId: string, values: { title?: string | null; body?: string }) => readJson<LogDetail>(await apiClient.api.workspaces[":workspaceId"].logs[":logId"].$patch({ param: { workspaceId, logId }, json: values })),
  setLogPosition: async (workspaceId: string, logId: string, posX: number, posY: number) => readJson<{ ok: true }>(await apiClient.api.workspaces[":workspaceId"].logs[":logId"].position.$patch({ param: { workspaceId, logId }, json: { posX, posY } })),
  setLogSize: async (workspaceId: string, logId: string, width: number, height: number) => readJson<{ ok: true }>(await apiClient.api.workspaces[":workspaceId"].logs[":logId"].size.$patch({ param: { workspaceId, logId }, json: { width, height } })),
  setLogZIndex: async (workspaceId: string, logId: string, zIndex: number) => readJson<{ ok: true }>(await apiClient.api.workspaces[":workspaceId"].logs[":logId"].zindex.$patch({ param: { workspaceId, logId }, json: { zIndex } })),
  duplicateLog: async (workspaceId: string, logId: string) => readJson<LogDetail>(await apiClient.api.workspaces[":workspaceId"].logs[":logId"].duplicate.$post({ param: { workspaceId, logId } })),
  deleteLog: async (workspaceId: string, logId: string) => readJson<{ ok: true }>(await apiClient.api.workspaces[":workspaceId"].logs[":logId"].$delete({ param: { workspaceId, logId } })),
  moveLog: async (workspaceId: string, logId: string, targetWorkspaceId: string) => readJson<LogDetail>(await apiClient.api.workspaces[":workspaceId"].logs[":logId"].move[":targetWorkspaceId"].$post({ param: { workspaceId, logId, targetWorkspaceId } })),
  tags: async (workspaceId: string, query: { from?: string; to?: string; page?: string | number } = {}) => readJson<{ tags: TagSummary[]; hasMore: boolean; page: number; limit: number }>(await apiClient.api.workspaces[":workspaceId"].tags.$get({ param: { workspaceId }, query: { ...query, page: query.page?.toString() } })),
  tasks: async (workspaceId: string, query: { day?: string; board?: string; from?: string; to?: string; status?: "pending" | "completed"; page?: string | number } = {}) => readJson<{ tasks: TaskSummary[]; hasMore: boolean; page: number; limit: number }>(await apiClient.api.workspaces[":workspaceId"].tasks.$get({ param: { workspaceId }, query: { ...query, page: query.page?.toString() } })),
  toggleTask: async (workspaceId: string, taskId: string, done: boolean) => readJson<{ log: LogDetail }>(await apiClient.api.workspaces[":workspaceId"].tasks[":taskId"].$patch({ param: { workspaceId, taskId }, json: { done } })),
  search: async (workspaceId: string, q: string) => readJson<{ results: SearchResult[] }>(await apiClient.api.workspaces[":workspaceId"].search.$get({ param: { workspaceId }, query: { q } })),
  attachments: async (workspaceId: string, query: { from?: string; to?: string; extension?: string; page?: string | number } = {}) => readJson<{ attachments: AttachmentSummary[]; hasMore: boolean; page: number; limit: number }>(await apiClient.api.workspaces[":workspaceId"].attachments.$get({ param: { workspaceId }, query: { ...query, page: query.page?.toString() } })),
  attachmentExtensions: async (workspaceId: string) => readJson<{ extensions: string[] }>(await apiClient.api.workspaces[":workspaceId"].attachments.extensions.$get({ param: { workspaceId } })),
  uploadAttachment: async (workspaceId: string, logId: string, file: File) => {
    const form = new FormData(); form.set("logId", logId); form.set("file", file);
    return readJson<{ id: string; filename: string; relativeLink: string; mime: string; size: number }>(await fetch(`/api/workspaces/${workspaceId}/attachments`, { method: "POST", body: form }));
  },
  deleteAttachment: async (workspaceId: string, attachmentId: string) => readJson<{ ok: true }>(await apiClient.api.workspaces[":workspaceId"].attachments[":attachmentId"].$delete({ param: { workspaceId, attachmentId } })),
  adminUsers: async () => readJson<{ users: UserSummary[] }>(await apiClient.api.admin.users.$get()),
  createUser: async (values: { name: string; email: string; password: string; role: "admin" | "user"; color?: UserColor }) => readJson<UserSummary>(await apiClient.api.admin.users.$post({ json: values })),
  updateUser: async (userId: string, values: { name?: string; color?: UserColor; password?: string; role?: "admin" | "user"; disabled?: boolean }) => readJson<{ ok: true }>(await apiClient.api.admin.users[":userId"].$patch({ param: { userId }, json: values })),
  deleteUser: async (userId: string) => readJson<{ ok: true }>(await apiClient.api.admin.users[":userId"].$delete({ param: { userId } })),
  adminWorkspaces: async () => readJson<{ workspaces: AdminWorkspaceSummary[] }>(await apiClient.api.admin.workspaces.$get()),
  createWorkspace: async (values: { name: string; color: WorkspaceColor; icon: WorkspaceIconName; memberIds: string[] }) => readJson<WorkspaceSummary>(await apiClient.api.admin.workspaces.$post({ json: values })),
  updateWorkspace: async (workspaceId: string, values: { name: string; color: WorkspaceColor; icon: WorkspaceIconName }) => readJson<{ ok: true }>(await apiClient.api.admin.workspaces[":workspaceId"].$patch({ param: { workspaceId }, json: values })),
  setWorkspaceMembers: async (workspaceId: string, userIds: string[]) => readJson<{ ok: true }>(await apiClient.api.admin.workspaces[":workspaceId"].members.$put({ param: { workspaceId }, json: { userIds } })),
  deleteWorkspace: async (workspaceId: string) => readJson<{ ok: true }>(await apiClient.api.admin.workspaces[":workspaceId"].$delete({ param: { workspaceId } })),
  instance: async () => readJson<{ settings: Record<string, string> }>(await apiClient.api.admin.instance.$get()),
  updateInstance: async (values: Record<string, string>) => readJson<{ ok: true }>(await apiClient.api.admin.instance.$put({ json: values })),
  templates: async (workspaceId: string) => readJson<{ templates: TemplateSummary[] }>(await apiClient.api.workspaces[":workspaceId"].templates.$get({ param: { workspaceId } })),
  createTemplate: async (workspaceId: string, values: { title?: string | null; body: string; enabled?: boolean }) => readJson<{ template: TemplateSummary }>(await apiClient.api.workspaces[":workspaceId"].templates.$post({ param: { workspaceId }, json: values })),
  updateTemplate: async (workspaceId: string, templateId: string, values: { title?: string | null; body?: string; enabled?: boolean }) => readJson<{ template: TemplateSummary }>(await apiClient.api.workspaces[":workspaceId"].templates[":id"].$put({ param: { workspaceId, id: templateId }, json: values })),
  deleteTemplate: async (workspaceId: string, templateId: string) => readJson<{ success: boolean }>(await apiClient.api.workspaces[":workspaceId"].templates[":id"].$delete({ param: { workspaceId, id: templateId } })),
  applyTemplates: async (workspaceId: string, day: string) => readJson<{ applied: boolean }>(await apiClient.api.workspaces[":workspaceId"].templates.apply.$post({ param: { workspaceId }, json: { day } })),
  updateTemplateMode: async (workspaceId: string, mode: "today_only" | "any_visited_day") => readJson<{ success: boolean }>(await apiClient.api.workspaces[":workspaceId"].templates.mode.$put({ param: { workspaceId }, json: { mode } })),
};
