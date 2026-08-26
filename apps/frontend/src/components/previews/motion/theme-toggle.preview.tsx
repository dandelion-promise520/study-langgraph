import { ThemeToggle } from "@/components/motion/theme-toggle";

export function ThemeTogglePreview() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-5">
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle
          variant="rectangle"
          start="bottom-up"
          className="rounded-xl border border-border bg-background p-2.5"
          iconClassName="h-5 w-5"
        />
      </div>
    </div>
  );
}
