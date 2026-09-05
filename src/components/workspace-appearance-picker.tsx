import { cn } from "@/lib/utils";
import { WORKSPACE_COLORS, type WorkspaceColor, type WorkspaceIconName } from "@/lib/workspace-appearance";
import { WorkspaceIcon, workspaceIconOptions } from "@/components/workspace-icon";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function WorkspaceColorPicker({ value, onValueChange }: { value: WorkspaceColor; onValueChange: (value: WorkspaceColor) => void }) {
  return <div role="radiogroup" aria-label="Workspace color" className="flex flex-wrap gap-2">
    {WORKSPACE_COLORS.map((color) => <button
      key={color}
      type="button"
      role="radio"
      aria-label={color.replace("bg-", "").replace("-500", "")}
      aria-checked={value === color}
      onClick={() => onValueChange(color)}
      className={cn("size-7 rounded-full transition-transform hover:scale-110", color, value === color && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
    />)}
  </div>;
}

export function WorkspaceIconPicker({ value, color, onValueChange }: { value: WorkspaceIconName; color: WorkspaceColor; onValueChange: (value: WorkspaceIconName) => void }) {
  const selected = workspaceIconOptions.find((option) => option.value === value) ?? workspaceIconOptions[0];

  return <DropdownMenu>
    <DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon-lg" aria-label={`Choose Workspace icon. Selected: ${selected.label}`} className="shrink-0 p-1" />}>
      <WorkspaceIcon icon={value} color={color} className="size-8 rounded-md [&_svg]:size-4" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-60">
      <DropdownMenuGroup>
        <DropdownMenuLabel>Workspace icon</DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuGroup className="grid grid-cols-5 gap-1">
        {workspaceIconOptions.map((option) => <DropdownMenuItem
          key={option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => onValueChange(option.value)}
          className={cn("h-9 justify-center px-0 py-0 text-muted-foreground", value === option.value && "bg-accent text-accent-foreground")}
        >
          <option.icon />
          <span className="sr-only">{option.label}</span>
        </DropdownMenuItem>)}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
