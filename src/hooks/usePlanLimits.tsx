import { useMemo } from "react";
import { useTenant } from "@/context/TenantContext";
import { useData } from "@/context/DataContext";
import { getPlanLimits, isUnlimited, PlanName, PlanLimits, ResourceKey, PLAN_LABELS } from "@/config/planLimits";

export interface ResourceUsage {
  current: number;
  limit: number;
  unlimited: boolean;
  percentage: number;
  remaining: number;
  atLimit: boolean;
}

export interface PlanUsage {
  plan: PlanName;
  planLabel: string;
  limits: PlanLimits;
  usage: Record<ResourceKey, ResourceUsage>;
  canUseFeature: (feature: 'match_center') => boolean;
}

export const usePlanLimits = (): PlanUsage => {
  const { tenant } = useTenant();
  const { properties, clients, users, agencies } = useData();

  const plan = (tenant?.plan || 'free') as PlanName;
  const limits = getPlanLimits(plan);

  const usage = useMemo(() => {
    const makeUsage = (current: number, limit: number): ResourceUsage => {
      const unlimited = isUnlimited(limit);
      return {
        current,
        limit,
        unlimited,
        percentage: unlimited ? 0 : limit > 0 ? Math.round((current / limit) * 100) : 100,
        remaining: unlimited ? Infinity : Math.max(0, limit - current),
        atLimit: !unlimited && current >= limit,
      };
    };

    return {
      properties: makeUsage(properties.length, limits.properties),
      clients: makeUsage(clients.length, limits.clients),
      team_members: makeUsage(users.length, limits.team_members),
      agencies: makeUsage(agencies.length, limits.agencies),
      portals: makeUsage(0, limits.portals), // loaded separately
      custom_fields: makeUsage(0, limits.custom_fields),
      api_keys: makeUsage(0, limits.api_keys),
      pipelines: makeUsage(0, limits.pipelines),
    } as Record<ResourceKey, ResourceUsage>;
  }, [properties.length, clients.length, users.length, agencies.length, limits]);

  const canUseFeature = (feature: 'match_center') => {
    return limits[feature];
  };

  return {
    plan,
    planLabel: PLAN_LABELS[plan] || 'Free',
    limits,
    usage,
    canUseFeature,
  };
};
