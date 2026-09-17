import Image from "next/image";
import { headerLogo } from "@/lib/brand";

/** Horizontal JJB wordmark for admin lock screens. No invented mark. */
export default function AdminWordmark({
  className,
}: {
  className?: string;
}) {
  return (
    <Image
      src={headerLogo.src}
      alt={headerLogo.alt}
      width={headerLogo.width}
      height={headerLogo.height}
      className={className}
      priority
    />
  );
}
