import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: Record<string, string>[]) => Promise<void>;
  fieldMap: { key: string; label: string; required?: boolean }[];
  entityName?: string;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === "," || ch === ";") {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export function CsvImportDialog({ open, onOpenChange, onImport, fieldMap, entityName = "registros" }: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reset = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setStep("upload");
    setImporting(false);
  };

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        toast({ title: "Error", description: "El archivo CSV está vacío", variant: "destructive" });
        return;
      }
      setFile(f);
      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map by fuzzy matching
      const autoMap: Record<string, string> = {};
      fieldMap.forEach(({ key, label }) => {
        const match = headers.find(h =>
          h.toLowerCase().replace(/[^a-záéíóúñ]/g, "") === key.toLowerCase().replace(/[^a-záéíóúñ]/g, "") ||
          h.toLowerCase().replace(/[^a-záéíóúñ]/g, "") === label.toLowerCase().replace(/[^a-záéíóúñ]/g, "")
        );
        if (match) autoMap[key] = match;
      });
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) handleFile(f);
  };

  const requiredMapped = fieldMap
    .filter(f => f.required)
    .every(f => mapping[f.key]);

  const mappedRows = csvRows.map(row => {
    const obj: Record<string, string> = {};
    fieldMap.forEach(({ key }) => {
      const csvCol = mapping[key];
      if (csvCol) {
        const idx = csvHeaders.indexOf(csvCol);
        obj[key] = idx >= 0 ? (row[idx] || "") : "";
      }
    });
    return obj;
  }).filter(row => Object.values(row).some(v => v.trim()));

  const handleImport = async () => {
    if (mappedRows.length === 0) return;
    setImporting(true);
    try {
      await onImport(mappedRows);
      toast({ title: "Importación completada", description: `${mappedRows.length} ${entityName} importados correctamente.` });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error en importación", description: err?.message || "Error desconocido", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar {entityName} desde CSV
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Arrastra tu archivo CSV aquí</p>
            <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
            <p className="text-xs text-muted-foreground mt-3">Separadores admitidos: coma (,) o punto y coma (;)</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{file?.name} — {csvRows.length} filas detectadas</span>
            </div>

            <p className="text-sm font-medium">Mapea las columnas del CSV a los campos del CRM:</p>

            <div className="space-y-2">
              {fieldMap.map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm w-40 shrink-0">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                  </span>
                  <Select
                    value={mapping[key] || "_none"}
                    onValueChange={(v) => setMapping(m => ({ ...m, [key]: v === "_none" ? "" : v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Sin asignar —</SelectItem>
                      {csvHeaders.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping[key] ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : required ? (
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  ) : null}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={() => setStep("preview")} disabled={!requiredMapped}>
                Vista previa ({mappedRows.length} filas)
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se importarán <strong>{mappedRows.length}</strong> {entityName}. Revisa las primeras filas:
            </p>

            <div className="border rounded-lg overflow-auto max-h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    {fieldMap.filter(f => mapping[f.key]).map(f => (
                      <TableHead key={f.key} className="text-xs whitespace-nowrap">{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedRows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {fieldMap.filter(f => mapping[f.key]).map(f => (
                        <TableCell key={f.key} className="text-xs">{row[f.key] || "—"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {mappedRows.length > 5 && (
              <p className="text-xs text-muted-foreground">...y {mappedRows.length - 5} filas más.</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("map")}>Volver</Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Importando..." : `Importar ${mappedRows.length} ${entityName}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
