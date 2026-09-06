import { Hono } from "hono";
import { DomainError } from "./domain/errors";
import { adminRoutes } from "./routes/admin";
import { attachmentRoutes } from "./routes/attachments";
import { authRoutes } from "./routes/auth";
import { logRoutes } from "./routes/logs";
import { injectDependencies, rejectReadOnly, requireAdmin, requireAuth, requireTargetWorkspace, requireWorkspace } from "./routes/middleware";
import { profileRoutes } from "./routes/profile";
import { searchRoutes } from "./routes/search";
import { setupRoutes } from "./routes/setup";
import { tagRoutes } from "./routes/tags";
import { taskRoutes } from "./routes/tasks";
import { templateRoutes } from "./routes/templates";
import type { AppConfig, AppEnv } from "./routes/types";
import { workspaceRoutes } from "./routes/workspaces";

export function createApp(config: AppConfig) {
  const app = new Hono<AppEnv>()
    .basePath("/api")
    .use("*", injectDependencies(config))
    .route("/setup", setupRoutes)
    .route("/auth", authRoutes)
    .use("*", requireAuth)
    .route("/profile", profileRoutes)
    .route("/workspaces", workspaceRoutes)
    .use("/workspaces/:workspaceId/*", requireWorkspace)
    .use("/workspaces/:workspaceId/*", rejectReadOnly(config.readOnly))
    .use("/workspaces/:workspaceId/logs/:logId/move/:targetWorkspaceId", requireTargetWorkspace)
    .route("/workspaces/:workspaceId/templates", templateRoutes)
    .route("/workspaces/:workspaceId/logs", logRoutes)
    .route("/workspaces/:workspaceId/tags", tagRoutes)
    .route("/workspaces/:workspaceId/tasks", taskRoutes)
    .route("/workspaces/:workspaceId/search", searchRoutes)
    .route("/workspaces/:workspaceId/attachments", attachmentRoutes(config))
    .use("/admin/*", requireAdmin)
    .use("/admin/*", rejectReadOnly(config.readOnly))
    .route("/admin", adminRoutes);

  app.onError((error, context) => {
    if (error instanceof DomainError) {
      const statuses = { NOT_FOUND: 404, UNAUTHORIZED: 401, FORBIDDEN: 403, CONFLICT: 409, VALIDATION: 400 } as const;
      return context.json({ error: { code: error.code, message: error.message } }, statuses[error.code as keyof typeof statuses] ?? 500);
    }
    console.error(error);
    return context.json({ error: { code: "INTERNAL", message: "Something went wrong" } }, 500);
  });

  return app;
}

export type AppType = ReturnType<typeof createApp>;
