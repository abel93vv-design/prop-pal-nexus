export interface PlanLimits {
  properties: number;
  clients: number;
  team_members: number;
  agencies: number;
  portals: number;
  custom_fields: number;
  api_keys: number;
  pipelines: number;
  storage_mb: number;
  match_center: boolean;
  activity_logs_days: number;
}

export type PlanName = 'free' | 'basic' | 'pro' | 'enterprise';

const UNLIMITED = 999999;

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    properties: 10,
    clients: 25,
    team_members: 1,
    agencies: 1,
    portals: 0,
    custom_fields: 3,
    api_keys: 0,
    pipelines: 10,
    storage_mb: 100,
    match_center: true,
    activity_logs_days: 7,
  },
  basic: {
    properties: 50,
    clients: 100,
    team_members: 3,
    agencies: 1,
    portals: 2,
    custom_fields: 10,
    api_keys: 1,
    pipelines: 50,
    storage_mb: 1000,
    match_center: true,
    activity_logs_days: 30,
  },
  pro: {
    properties: 250,
    clients: 500,
    team_members: 10,
    agencies: 5,
    portals: 5,
    custom_fields: 25,
    api_keys: 2,
    pipelines: UNLIMITED,
    storage_mb: 10000,
    match_center: true,
    activity_logs_days: 90,
  },
  enterprise: {
    properties: UNLIMITED,
    clients: UNLIMITED,
    team_members: UNLIMITED,
    agencies: UNLIMITED,
    portals: UNLIMITED,
    custom_fields: UNLIMITED,
    api_keys: UNLIMITED,
    pipelines: UNLIMITED,
    storage_mb: UNLIMITED,
    match_center: true,
    activity_logs_days: UNLIMITED,
  },
};

export const PLAN_LABELS: Record<PlanName, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export const PLAN_PRICES: Record<PlanName, number> = {
  free: 0,
  basic: 29,
  pro: 79,
  enterprise: 199,
};

export const PLAN_ORDER: PlanName[] = ['free', 'basic', 'pro', 'enterprise'];

export const isUnlimited = (value: number) => value >= UNLIMITED;

export const getPlanLimits = (plan: string): PlanLimits => {
  return PLAN_LIMITS[plan as PlanName] || PLAN_LIMITS.free;
};

export type ResourceKey = keyof Pick<PlanLimits,
  'properties' | 'clients' | 'team_members' | 'agencies' | 'portals' | 'custom_fields' | 'api_keys' | 'pipelines'
>;
