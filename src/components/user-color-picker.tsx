import { USER_COLORS, type UserColor } from "@/lib/user-colors";
import { cn } from "@/lib/utils";

export function UserColorPicker({ value, onValueChange }: { value: UserColor; onValueChange: (value: UserColor) => void }) {
  return (
    <div role="radiogroup" aria-label="Avatar color" className="flex flex-wrap gap-2">
      {USER_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-label={color.replace("bg-", "").replace("-500", "")}
          aria-checked={value === color}
          onClick={() => onValueChange(color)}
          className={cn(
            "size-7 rounded-full transition-transform hover:scale-110",
            color,
            value === color && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
        />
      ))}
    </div>
  );
}
