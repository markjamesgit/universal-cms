import { Service, ServiceVariant } from "../types";

export function hasServiceVariants(service: Service): boolean {
  return Array.isArray(service.variants) && service.variants.length > 0;
}

export function getEffectivePrice(service: Service, variant?: ServiceVariant | null): number {
  if (variant) return variant.price;
  if (hasServiceVariants(service)) {
    return Math.min(...service.variants!.map((v) => v.price));
  }
  return service.price;
}

export function getEffectiveDuration(service: Service, variant?: ServiceVariant | null): number {
  if (variant) return variant.duration;
  if (hasServiceVariants(service)) {
    return service.variants![0].duration;
  }
  return service.duration;
}

export function getBookingServiceLabel(service: Service, variant?: ServiceVariant | null): string {
  if (variant) return `${service.name} — ${variant.name}`;
  return service.name;
}

export function newVariantId(): string {
  return "sv-" + Math.random().toString(36).slice(2, 9);
}
