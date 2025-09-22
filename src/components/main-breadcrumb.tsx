"use client";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTranslations } from "next-intl";

export default function MainBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations();
  const segments = pathname.split("/").filter(Boolean);

  const formatSegment = (segment: string) => {
    const translationKey = `breadcrumbs.${segment}`;
    try {
      return t(translationKey);
    } catch {
      return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          return (
            <BreadcrumbItem key={index}>
              <BreadcrumbLink 
                href={href}
                className={isLast ? "font-semibold" : ""}
              >
                {formatSegment(segment)}
              </BreadcrumbLink>
              {!isLast && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}