import { useState, useMemo, Fragment } from "react";
import { Layout } from "@/components/Layout";
import { useMatchCenter, MatchScore, CriteriaDetail } from "@/hooks/useMatchCenter";
import { useData } from "@/context/DataContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Search, RefreshCw, Loader2, ArrowUpDown, Target, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Check, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryLabels: Record<string, string> = { high: "Alto", medium: "Medio", low: "Bajo" };
const categoryColors: Record<string, string> = {
  high: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};
const viabilityColors: Record<string, string> = {
  Viable: "bg-success/10 text-success border-success/20",
  Risk: "bg-warning/10 text-warning border-warning/20",
  "Not Viable": "bg-destructive/10 text-destructive border-destructive/20",
};
const viabilityLabels: Record<string, string> = {
  Viable: "Viable",
  Risk: "en riesgo",
  "Not Viable": "No viable",
};

const PAGE_SIZE = 25;

const MatchCenter = () => {
  const { canUseFeature } = usePlanLimits();
  const { matches, loading, calculating, runMatching } = useMatchCenter();
  const { clients, properties, users } = useData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterViability, setFilterViability] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [sortField, setSortField] = useState<"total_score" | "property_score" | "financial_score">("total_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!canUseFeature('match_center')) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center space-y-4">
              <Target className="w-12 h-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Match Center no disponible</h2>
              <p className="text-sm text-muted-foreground">
                Esta funcionalidad está disponible a partir del plan Basic. Actualiza tu plan en Ajustes → Plan para acceder.
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/ajustes'}>
                Ver planes
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (filterCategory !== "all" && m.category !== filterCategory) return false;
        if (filterViability !== "all" && m.viability_status !== filterViability) return false;
        if (search) {
          const client = clients.find((c) => c.id === m.client_id);
          const property = properties.find((p) => p.id === m.property_id);
          const q = search.toLowerCase();
          const phoneNorm = (client?.phone || "").replace(/\D/g, "");
          const qNorm = q.replace(/\D/g, "");
          const matchPhone = qNorm.length > 0 && phoneNorm.includes(qNorm);
          if (
            !client?.name.toLowerCase().includes(q) &&
            !property?.title.toLowerCase().includes(q) &&
            !matchPhone
          ) return false;
        }
        if (filterAgent !== "all") {
          const property = properties.find((p) => p.id === m.property_id);
          if (property?.agentId !== filterAgent) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const mul = sortDir === "desc" ? -1 : 1;
        return (a[sortField] - b[sortField]) * mul;
      });
  }, [matches, search, filterCategory, filterViability, filterAgent, sortField, sortDir, clients, properties]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleRunMatching = async () => {
    const result = await runMatching();
    toast({
      title: "Matching completado",
      description: `${result?.matches || 0} matches calculados (${result?.clients || 0} clientes × ${result?.properties || 0} propiedades)`,
    });
  };

  const highCount = matches.filter((m) => m.category === "high").length;
  const mediumCount = matches.filter((m) => m.category === "medium").length;
  const viableCount = matches.filter((m) => m.viability_status === "Viable").length;
  const avgScore = matches.length > 0 ? Math.round(matches.reduce((s, m) => s + m.total_score, 0) / matches.length) : 0;

  return (
    <Layout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Match Center</h1>
            <p className="text-sm text-muted-foreground">{matches.length} matches calculados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const esc = (v: any) => {
                const s = String(v ?? "");
                return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
              };
              const headers = ["Cliente", "Teléfono", "Propiedad", "Precio", "P. Score", "F. Score", "Total", "Categoría", "Viabilidad"];
              const rows = filtered.map((m) => {
                const c = clients.find((x) => x.id === m.client_id);
                const p = properties.find((x) => x.id === m.property_id);
                return [
                  c?.name || "",
                  c?.phone || "",
                  p?.title || "",
                  p?.price ?? "",
                  m.property_score,
                  m.financial_score,
                  m.total_score,
                  categoryLabels[m.category] || m.category,
                  viabilityLabels[m.viability_status] || m.viability_status,
                ].map(esc).join(";");
              });
              const csv = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `match-center-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-1" /> Exportar CSV
            </Button>
            <Button onClick={handleRunMatching} disabled={calculating} size="sm">
              {calculating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              {calculating ? "Calculando..." : "Recalcular Matches"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Match Alto</span>
            </div>
            <p className="text-xl font-bold text-foreground">{highCount}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Match Medio</span>
            </div>
            <p className="text-xl font-bold text-foreground">{mediumCount}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-info" />
              <span className="text-xs text-muted-foreground">Viables</span>
            </div>
            <p className="text-xl font-bold text-foreground">{viableCount}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Score Promedio</span>
            </div>
            <p className="text-xl font-bold text-foreground">{avgScore}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente, teléfono o propiedad..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterViability} onValueChange={setFilterViability}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Viabilidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Viable">Viable</SelectItem>
              <SelectItem value="Risk">Riesgo</SelectItem>
              <SelectItem value="Not Viable">No Viable</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Agente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-8"></TableHead>
                <TableHead className="font-semibold text-xs">Cliente</TableHead>
                <TableHead className="font-semibold text-xs">Propiedad</TableHead>
                <TableHead className="font-semibold text-xs">Agente</TableHead>
                <TableHead className="font-semibold text-xs cursor-pointer" onClick={() => toggleSort("property_score")}>
                  <div className="flex items-center gap-1">P. Score <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="font-semibold text-xs cursor-pointer" onClick={() => toggleSort("financial_score")}>
                  <div className="flex items-center gap-1">F. Score <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="font-semibold text-xs cursor-pointer" onClick={() => toggleSort("total_score")}>
                  <div className="flex items-center gap-1">Total <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="font-semibold text-xs">Categoría</TableHead>
                <TableHead className="font-semibold text-xs">Viabilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-sm text-muted-foreground">
                    {matches.length === 0 ? "No hay matches calculados. Haz clic en 'Recalcular Matches' para comenzar." : "No se encontraron resultados con los filtros actuales."}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((m) => {
                  const client = clients.find((c) => c.id === m.client_id);
                  const property = properties.find((p) => p.id === m.property_id);
                  const agent = property ? users.find((u) => u.id === property.agentId) : null;
                  const isExpanded = expandedRows.has(m.id);
                  return (
                    <Fragment key={m.id}>
                      <TableRow
                        className="hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => toggleExpanded(m.id)}
                      >
                        <TableCell className="w-8 px-2">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{client?.name || "—"}</p>
                            <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
                              {client?.email && <span>{client.email}</span>}
                              {client?.phone && <span>{client.phone}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {client?.leadStatus && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0">{client.leadStatus}</Badge>
                              )}
                              {client?.contactCount != null && (
                                <span className="text-[9px] text-muted-foreground">{client.contactCount} contactos</span>
                              )}
                              {client?.lastContactedAt && (
                                <span className="text-[9px] text-muted-foreground">Últ: {new Date(client.lastContactedAt).toLocaleDateString("es-ES")}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{property?.title || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{property ? `${property.price.toLocaleString("es-ES")} €` : ""}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{agent?.name || "—"}</TableCell>
                        <TableCell><ScoreBar value={m.property_score} /></TableCell>
                        <TableCell><ScoreBar value={m.financial_score} /></TableCell>
                        <TableCell>
                          <span className="text-sm font-bold">{m.total_score}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${categoryColors[m.category]}`}>
                            {categoryLabels[m.category] || m.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${viabilityColors[m.viability_status]}`}>
                            {viabilityLabels[m.viability_status] || m.viability_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={9} className="p-0">
                            <MatchBreakdown match={m} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

function MatchBreakdown({ match }: { match: MatchScore }) {
  const details = match.score_details;

  if (!details || !details.property || !details.financial) {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        Sin desglose disponible. Recalcula los matches para obtener el desglose detallado.
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Property Score Breakdown */}
      <ScoreSection
        title="Compatibilidad de Propiedad"
        icon={<Target className="w-4 h-4 text-primary" />}
        total={details.property.total}
        weight="70%"
        criteria={details.property.criteria.filter(c => c.weight > 0)}
      />

      {/* Financial Score Breakdown */}
      <ScoreSection
        title="Viabilidad Financiera"
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
        total={details.financial.total}
        weight="30%"
        criteria={details.financial.criteria}
      />
    </div>
  );
}

function ScoreSection({ title, icon, total, weight, criteria }: {
  title: string;
  icon: React.ReactNode;
  total: number;
  weight: string;
  criteria: CriteriaDetail[];
}) {
  const color = total >= 75 ? "text-success" : total >= 60 ? "text-warning" : total >= 40 ? "text-orange-500" : "text-destructive";
  const progressColor = total >= 75 ? "[&>div]:bg-success" : total >= 60 ? "[&>div]:bg-warning" : total >= 40 ? "[&>div]:bg-orange-500" : "[&>div]:bg-destructive";

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-[10px] text-muted-foreground">({weight} del total)</span>
        </div>
        <span className={`text-lg font-bold ${color}`}>{total}%</span>
      </div>

      <Progress value={total} className={`h-2 ${progressColor}`} />

      <div className="space-y-2">
        {criteria.map((c, i) => (
          <CriteriaRow key={i} criteria={c} />
        ))}
      </div>
    </div>
  );
}

function CriteriaRow({ criteria }: { criteria: CriteriaDetail }) {
  const scoreColor = criteria.score >= 75 ? "text-success" : criteria.score >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="flex items-start gap-2 text-xs">
      <div className="mt-0.5 shrink-0">
        {criteria.met
          ? <Check className="w-3.5 h-3.5 text-success" />
          : <X className="w-3.5 h-3.5 text-destructive/60" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">{criteria.label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {criteria.weight > 0 && (
              <span className="text-[9px] text-muted-foreground">{criteria.weight}%</span>
            )}
            <span className={`font-bold ${scoreColor}`}>{criteria.score}</span>
          </div>
        </div>
        <p className="text-muted-foreground leading-tight mt-0.5">{criteria.detail}</p>
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 75 ? "bg-success" : value >= 60 ? "bg-warning" : value >= 40 ? "bg-info" : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-6">{value}</span>
    </div>
  );
}

export default MatchCenter;
