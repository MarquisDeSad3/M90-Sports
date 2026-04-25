import { asset, cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "navy" | "cream" | "white" | "red";
};

const SRC: Record<NonNullable<Props["variant"]>, string> = {
  navy: asset("/brand/m90-navy.png"),
  cream: asset("/brand/m90-cream.png"),
  red: asset("/brand/m90-red.png"),
  white: asset("/brand/m90-cream.png"),
};

export function Logo({ className, variant = "navy" }: Props) {
  return (
    <img
      src={SRC[variant]}
      alt="M90"
      draggable={false}
      className={cn(
        "inline-block h-[1em] w-auto select-none align-middle",
        variant === "white" && "brightness-[1.4] saturate-0",
        className,
      )}
    />
  );
}
