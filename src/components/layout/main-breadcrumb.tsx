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
import { 
  Home, 
  BarChart3, 
  CreditCard, 
  Settings, 
  Tag,
  ArrowRight,
  PiggyBank,
  ReceiptText
} from "lucide-react";

export default function MainBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations();
  const segments = pathname.split("/").filter(Boolean);

  // Add home icon for root dashboard
  const getSegmentIcon = (segment: string, index: number) => {
    if (index === 0 && segment === "dashboard") return <Home className="h-4 w-4" />;
    if (segment === "dashboard") return <BarChart3 className="h-4 w-4" />;
    if (segment === "transactions") return <ReceiptText className="h-4 w-4" />;
    if (segment === "wallets") return <CreditCard className="h-4 w-4" />;
    if (segment === "savings") return <PiggyBank className="h-4 w-4" />;
    if (segment === "categories") return <Tag className="h-4 w-4" />;
    if (segment === "settings") return <Settings className="h-4 w-4" />;
    return null;
  };

  const formatSegment = (segment: string) => {
    const translationKey = `breadcrumbs.${segment}`;
    try {
      return t(translationKey);
    } catch {
      return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    }
  };

  // Always start with Dashboard if we're not already there
  const breadcrumbItems = [];
  
  // Add Dashboard as first item if not already present
  if (!segments.includes("dashboard") && pathname !== "/") {
    breadcrumbItems.push({
      segment: "dashboard",
      href: "/dashboard",
      isLast: false,
      index: -1
    });
  }

  // Add current path segments
  segments.forEach((segment, index) => {
    breadcrumbItems.push({
      segment,
      href: `/${segments.slice(0, index + 1).join("/")}`,
      isLast: index === segments.length - 1,
      index
    });
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, breadcrumbIndex) => {
          const icon = getSegmentIcon(item.segment, item.index);
          const isLast = item.isLast;

          return (
            <BreadcrumbItem key={breadcrumbIndex}>
              {isLast ? (
                <div className="flex items-center gap-2 font-semibold text-foreground cursor-default">
                  {icon}
                  <span>{formatSegment(item.segment)}</span>
                </div>
              ) : (
                <BreadcrumbLink 
                  href={item.href}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  {icon}
                  <span>{formatSegment(item.segment)}</span>
                </BreadcrumbLink>
              )}
              {!isLast && (
                <BreadcrumbSeparator>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </BreadcrumbSeparator>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}