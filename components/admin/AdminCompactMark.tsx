import Image from "next/image";
import { compactMark } from "@/lib/brand";

/** Compact ouroboros mark for admin chrome (sidebar). Not the public header logo. */
export default function AdminCompactMark({
  className,
}: {
  className?: string;
}) {
  return (
    <Image
      src={compactMark.src}
      alt={compactMark.alt}
      width={compactMark.width}
      height={compactMark.height}
      className={className}
      priority
    />
  );
}
