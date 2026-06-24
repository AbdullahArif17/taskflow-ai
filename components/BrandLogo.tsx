import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: number;
};

export function BrandLogo({ className, size = 36 }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-[#10211c] ring-1 ring-white/10",
        className,
      )}
      style={{ height: size, width: size }}
    >
      <Image
        alt=""
        aria-hidden="true"
        height={size}
        priority
        src="/brand/taskflow-logo.png"
        width={size}
      />
    </span>
  );
}
