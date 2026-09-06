import {
  BookOpenIcon,
  BoxIcon,
  BriefcaseIcon,
  Building2Icon,
  CloudIcon,
  Code2Icon,
  DatabaseIcon,
  FolderIcon,
  GalleryVerticalEndIcon,
  Globe2Icon,
  LightbulbIcon,
  NotebookTabsIcon,
  PackageIcon,
  PaletteIcon,
  RocketIcon,
  ServerIcon,
  SparklesIcon,
  TargetIcon,
  TerminalIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_WORKSPACE_ICON, type WorkspaceColor, type WorkspaceIconName } from "@/lib/workspace-appearance";

export const workspaceIconOptions: { value: WorkspaceIconName; label: string; icon: LucideIcon }[] = [
  { value: "gallery", label: "Gallery", icon: GalleryVerticalEndIcon },
  { value: "users", label: "People", icon: UsersIcon },
  { value: "briefcase", label: "Work", icon: BriefcaseIcon },
  { value: "building", label: "Company", icon: Building2Icon },
  { value: "rocket", label: "Launch", icon: RocketIcon },
  { value: "code", label: "Code", icon: Code2Icon },
  { value: "terminal", label: "Terminal", icon: TerminalIcon },
  { value: "database", label: "Database", icon: DatabaseIcon },
  { value: "server", label: "Server", icon: ServerIcon },
  { value: "cloud", label: "Cloud", icon: CloudIcon },
  { value: "package", label: "Package", icon: PackageIcon },
  { value: "folder", label: "Folder", icon: FolderIcon },
  { value: "notebook", label: "Notebook", icon: NotebookTabsIcon },
  { value: "book", label: "Book", icon: BookOpenIcon },
  { value: "box", label: "Box", icon: BoxIcon },
  { value: "lightbulb", label: "Idea", icon: LightbulbIcon },
  { value: "target", label: "Target", icon: TargetIcon },
  { value: "sparkles", label: "Sparkles", icon: SparklesIcon },
  { value: "palette", label: "Creative", icon: PaletteIcon },
  { value: "globe", label: "Globe", icon: Globe2Icon },
];

const iconByName = Object.fromEntries(workspaceIconOptions.map((option) => [option.value, option.icon])) as Record<WorkspaceIconName, LucideIcon>;

export function WorkspaceIcon({ icon, color, className }: { icon?: WorkspaceIconName; color: WorkspaceColor; className?: string }) {
  const Icon = iconByName[icon ?? DEFAULT_WORKSPACE_ICON] ?? GalleryVerticalEndIcon;
  // Inline style, not just a Tailwind class: dropdown menu items paint every
  // descendant with the accent-foreground color on hover/focus
  // (`**:text-accent-foreground` in dropdown-menu.tsx), which is dark in
  // light mode - only a same-element inline style reliably wins over that.
  return <div data-slot="workspace-icon" className={cn("flex shrink-0 items-center justify-center rounded-lg", color, className)} style={{ color: "#fff" }}><Icon /></div>;
}
