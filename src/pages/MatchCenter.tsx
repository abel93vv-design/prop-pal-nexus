import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useMatchCenter } from "@/hooks/useMatchCenter";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, Loader2, ArrowUpDown, Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
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

const PAGE_SIZE = 25;

const MatchCenter = () => {
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

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (filterCategory !== "all" && m.category !== filterCategory) return false;
        if (filterViability !== "all" && m.viability_status !== filterViability) return false;
        if (search) {
          const client = clients.find((c) => c.id === m.client_id);
          const property = properties.find((p) => p.id === m.property_id);
          const q = search.toLowerCase();
          if (
            !client?.name.toLowerCase().includes(q) &&
            !property?.title.toLowerCase().includes(q)
          )
            return false;
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

  // Stats
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
          <Button onClick={handleRunMatching} disabled={calculating} size="sm">
            {calculating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            {calculating ? "Calculando..." : "Recalcular Matches"}
          </Button>
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
            <Input placeholder="Buscar por cliente o propiedad..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <TableHead className="font-semibold text-xs">Actualizado</TableHead>
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
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/20">
                      <TableCell className="text-sm font-medium">{client?.name || "—"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{property?.title || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{property ? `${property.price.toLocaleString("es-ES")} €` : ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{agent?.name || "—"}</TableCell>
                      <TableCell>
                        <ScoreBar value={m.property_score} />
                      </TableCell>
                      <TableCell>
                        <ScoreBar value={m.financial_score} />
                      </TableCell>
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
                          {m.viability_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {new Date(m.last_calculated_at).toLocaleDateString("es-ES")}
                      </TableCell>
                    </TableRow>
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
