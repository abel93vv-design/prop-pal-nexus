import { useMemo, useState, useEffect } from "react";
import { usePipeline } from "@/hooks/usePipeline";
import { useData } from "@/context/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Clock, DollarSign, BarChart3,
  Target, Users, ArrowRight
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PipelineAnalytics({ open, onOpenChange }: Props) {
  const { stages, opportunities } = usePipeline();
  const { users } = useData();
  const { tenantId } = useTenant();
  const [history, setHistory] = useState<any[]>([]);

  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tenantId) return;
    setHistoryError(null);
    supabase.from('stage_history').select('*').eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(2000)
      .then(({ data, error }) => {
        if (error) { setHistoryError(error.message); setHistory([]); return; }
        setHistory(data || []);
      });
  }, [open, tenantId]);

  const activeStages = stages.filter(s => s.is_active).sort((a, b) => a.position - b.position);
  const wonStages = stages.filter(s => s.stage_type === 'closed_won');
  const lostStages = stages.filter(s => s.stage_type === 'closed_lost');
  const wonStageIds = wonStages.map(s => s.id);
  const lostStageIds = lostStages.map(s => s.id);

  const wonOpps = opportunities.filter(o => wonStageIds.includes(o.stage_id));
  const lostOpps = opportunities.filter(o => lostStageIds.includes(o.stage_id));
  const activeOpps = opportunities.filter(o => !wonStageIds.includes(o.stage_id) && !lostStageIds.includes(o.stage_id));

  const totalWonRevenue = wonOpps.reduce((s, o) => s + o.deal_value, 0);
  const totalLostValue = lostOpps.reduce((s, o) => s + o.deal_value, 0);
  const forecast = activeOpps.reduce((s, o) => s + o.deal_value * o.probability / 100, 0);

  // Average days to close (won)
  const avgClosingDays = useMemo(() => {
    if (wonOpps.length === 0) return 0;
    const totalDays = wonOpps.reduce((s, o) => {
      return s + Math.floor((new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()) / 86400000);
    }, 0);
    return Math.round(totalDays / wonOpps.length);
  }, [wonOpps]);

  // Conversion per stage
  const stageMetrics = useMemo(() => {
    return activeStages.map(stage => {
      const stageOpps = opportunities.filter(o => o.stage_id === stage.id);
      const count = stageOpps.length;
      const value = stageOpps.reduce((s, o) => s + o.deal_value, 0);
      // Days in stage from history
      const stageHistoryEntries = history.filter(h => h.from_stage_id === stage.id);
      const avgDays = stageHistoryEntries.length > 0
        ? Math.round(stageHistoryEntries.reduce((s, h) => s + (h.days_in_previous_stage || 0), 0) / stageHistoryEntries.length)
        : 0;

      return { stage, count, value, avgDays };
    });
  }, [activeStages, opportunities, history]);

  // Agent performance
  const agentMetrics = useMemo(() => {
    const agentIds = [...new Set(opportunities.map(o => o.agent_id).filter(Boolean))];
    return agentIds.map(agentId => {
      const agent = users.find(u => u.id === agentId);
      const agentOpps = opportunities.filter(o => o.agent_id === agentId);
      const won = agentOpps.filter(o => wonStageIds.includes(o.stage_id));
      const revenue = won.reduce((s, o) => s + o.deal_value, 0);
      return { agent, total: agentOpps.length, won: won.length, revenue };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [opportunities, users, wonStageIds]);

  const conversionRate = opportunities.length > 0
    ? Math.round((wonOpps.length / opportunities.length) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Métricas del Pipeline</DialogTitle></DialogHeader>
        {historyError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            No se pudo cargar el histórico de etapas: {historyError}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard icon={DollarSign} label="Ingresos cerrados" value={`${totalWonRevenue.toLocaleString('es-ES')} €`} color="text-success" />
          <MetricCard icon={TrendingUp} label="Forecast" value={`${forecast.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`} color="text-primary" />
          <MetricCard icon={Target} label="Tasa de conversión" value={`${conversionRate}%`} color="text-warning" />
          <MetricCard icon={Clock} label="Días prom. al cierre" value={`${avgClosingDays}d`} color="text-info" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={TrendingDown} label="Valor perdido" value={`${totalLostValue.toLocaleString('es-ES')} €`} color="text-destructive" />
          <MetricCard icon={BarChart3} label="Oportunidades activas" value={`${activeOpps.length}`} color="text-foreground" />
        </div>

        {/* Stage funnel */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Funnel por Etapa</h3>
          <div className="space-y-1.5">
            {stageMetrics.map(({ stage, count, value, avgDays }) => {
              const maxCount = Math.max(...stageMetrics.map(m => m.count), 1);
              const width = Math.max((count / maxCount) * 100, 8);
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 text-right">
                    <span className="text-xs font-medium text-foreground">{stage.name}</span>
                  </div>
                  <div className="flex-1 h-7 bg-muted/30 rounded overflow-hidden relative">
                    <div className="h-full rounded flex items-center px-2 transition-all" style={{ width: `${width}%`, backgroundColor: stage.color + '30' }}>
                      <span className="text-[10px] font-medium" style={{ color: stage.color }}>{count}</span>
                    </div>
                  </div>
                  <div className="w-20 shrink-0 text-right">
                    <span className="text-[10px] text-muted-foreground">{value.toLocaleString('es-ES')} €</span>
                  </div>
                  <div className="w-12 shrink-0 text-right">
                    <span className="text-[10px] text-muted-foreground">{avgDays}d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Performance */}
        {agentMetrics.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Rendimiento por Agente
            </h3>
            <div className="space-y-1.5">
              {agentMetrics.map(({ agent, total, won, revenue }) => (
                <div key={agent?.id || 'unknown'} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{agent?.name?.charAt(0) || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{agent?.name || 'Sin asignar'}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{total} total</Badge>
                  <Badge variant="outline" className="text-[10px] bg-success/10 text-success">{won} ganadas</Badge>
                  <span className="text-xs font-bold text-foreground">{revenue.toLocaleString('es-ES')} €</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
