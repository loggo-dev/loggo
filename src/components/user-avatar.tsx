import type { UserColor } from "@/lib/user-colors";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserAvatar({ name, color, className }: { name: string; color: UserColor; className?: string }) {
  return (
    <Avatar className={cn("shrink-0", className)}>
      <AvatarFallback className={cn(color, "font-semibold text-white")}>
        {name.trim().charAt(0).toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
