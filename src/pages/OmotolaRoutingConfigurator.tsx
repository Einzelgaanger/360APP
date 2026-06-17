import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Lock,
  LockOpen,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { EO_SUBSIDIARY_ID } from '@/lib/eoPilot';
import { downloadRoutingExcel } from '@/lib/omotolaRoutingExport';
import {
  ROUTING_FORM_OPTIONS,
  ROUTING_STORAGE_KEY,
  OMOTOLA_PRIMARY_EMAIL,
  type EmployeeOption,
  type PersonRoutingConfig,
  type RoutingFormCode,
  type RoutingWorkbook,
  emptyPersonConfig,
  formLabel,
  newId,
} from '@/lib/omotolaRoutingTypes';

function loadWorkbook(): RoutingWorkbook | null {
  try {
    const raw = localStorage.getItem(ROUTING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RoutingWorkbook;
  } catch {
    return null;
  }
}

function saveWorkbook(wb: RoutingWorkbook) {
  localStorage.setItem(ROUTING_STORAGE_KEY, JSON.stringify(wb));
}

export default function OmotolaRoutingConfigurator() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<RoutingWorkbook>(() => ({
    version: 1,
    updatedAt: new Date().toISOString(),
    configuredBy: OMOTOLA_PRIMARY_EMAIL,
    people: {},
  }));

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, email, role, hierarchy_level, department_code')
      .eq('subsidiary_id', EO_SUBSIDIARY_ID)
      .eq('eo_appraisal_active', true)
      .order('hierarchy_level')
      .order('name');
    if (error) {
      toast.error(error.message);
      setEmployees([]);
    } else {
      setEmployees((data ?? []) as EmployeeOption[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    const saved = loadWorkbook();
    if (saved) setWorkbook(saved);
  }, []);

  useEffect(() => {
    if (employees.length && !selectedId) setSelectedId(employees[0].id);
  }, [employees, selectedId]);

  const persist = useCallback((next: RoutingWorkbook) => {
    const stamped = { ...next, updatedAt: new Date().toISOString(), configuredBy: next.configuredBy || OMOTOLA_PRIMARY_EMAIL };
    setWorkbook(stamped);
    saveWorkbook(stamped);
  }, []);

  const selected = employees.find((e) => e.id === selectedId) ?? null;

  const config: PersonRoutingConfig = useMemo(() => {
    if (!selectedId) return emptyPersonConfig('');
    return workbook.people[selectedId] ?? emptyPersonConfig(selectedId);
  }, [workbook, selectedId]);

  const updateConfig = (patch: Partial<PersonRoutingConfig>) => {
    if (!selectedId) return;
    const current = workbook.people[selectedId] ?? emptyPersonConfig(selectedId);
    if (current.locked && patch.locked !== false) {
      toast.error('Unlock this person before editing.');
      return;
    }
    persist({
      ...workbook,
      people: {
        ...workbook.people,
        [selectedId]: { ...current, ...patch, employeeId: selectedId },
      },
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.department_code ?? '').toLowerCase().includes(q),
    );
  }, [employees, search]);

  const lockedCount = useMemo(
    () => employees.filter((e) => workbook.people[e.id]?.locked).length,
    [employees, workbook.people],
  );

  const handleExport = () => {
    if (lockedCount < employees.length) {
      toast.message('Some people are not locked yet', {
        description: 'Exporting anyway — lock each person when their routing is final.',
      });
    }
    downloadRoutingExcel(workbook, employees);
    toast.success('Excel downloaded');
  };

  const addSelfForm = (formCode: RoutingFormCode) => {
    updateConfig({
      selfAssessments: [...config.selfAssessments, { id: newId(), formCode }],
    });
  };

  const addReview = (revieweeId: string, formCode: RoutingFormCode) => {
    updateConfig({
      reviewAssignments: [
        ...config.reviewAssignments,
        { id: newId(), revieweeId, formCode, notes: '' },
      ],
    });
  };

  const addCommentGive = (revieweeId: string) => {
    updateConfig({
      commentsGive: [...config.commentsGive, { id: newId(), revieweeId }],
    });
  };

  const addCommentReceive = (fromEmployeeId: string) => {
    updateConfig({
      commentsReceive: [...config.commentsReceive, { id: newId(), fromEmployeeId }],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">EO routing designer</p>
            <h1 className="text-lg font-bold">Appraisal relationships — per person</h1>
            <p className="text-xs text-muted-foreground max-w-xl mt-1">
              Choose one person at a time. Define their self forms, who they review (and which document), and comment
              flows. Lock each person when done, then download Excel to send for implementation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/hub?tab=survey">
                <ArrowLeft className="w-4 h-4 mr-1" /> Hub
              </Link>
            </Button>
            <Button size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="w-4 h-4" /> Download Excel
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-[280px_1fr] gap-4">
        <aside className="glass-panel p-4 space-y-3 h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Team ({employees.length})
            </span>
            <Badge variant="outline" className="text-[10px]">
              {lockedCount}/{employees.length} locked
            </Badge>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
          <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filtered.map((emp) => {
              const cfg = workbook.people[emp.id];
              const active = emp.id === selectedId;
              return (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(emp.id)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${
                      active ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium truncate">{emp.name}</span>
                      {cfg?.locked ? (
                        <Lock className="w-3 h-3 text-primary shrink-0" />
                      ) : (
                        <LockOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      L{emp.hierarchy_level ?? '?'}
                      {cfg
                        ? ` · ${cfg.selfAssessments.length + cfg.reviewAssignments.length + cfg.commentsGive.length} rules`
                        : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="space-y-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a person from the list.</p>
          ) : (
            <>
              <div className="glass-panel p-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-bold">{selected.name}</h2>
                    <Badge variant="secondary" className="text-[10px]">
                      L{selected.hierarchy_level ?? '?'}
                    </Badge>
                    {config.locked && (
                      <Badge className="text-[10px] bg-emerald-600">Locked</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{selected.email}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{selected.role}</p>
                </div>
                <Button
                  variant={config.locked ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => updateConfig({ locked: !config.locked })}
                  className="gap-1.5"
                >
                  {config.locked ? (
                    <>
                      <LockOpen className="w-4 h-4" /> Unlock to edit
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Lock relationships
                    </>
                  )}
                </Button>
              </div>

              <Section
                title="1. Self assessments"
                hint="Forms this person completes about themselves. Add as many as needed (e.g. monthly + performance)."
                locked={config.locked}
              >
                {config.selfAssessments.map((row) => (
                  <Row key={row.id}>
                    <span className="text-xs font-medium">{formLabel(row.formCode)}</span>
                    <Badge variant="outline" className="text-[10px]">{row.formCode}</Badge>
                    {!config.locked && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 ml-auto"
                        onClick={() =>
                          updateConfig({
                            selfAssessments: config.selfAssessments.filter((s) => s.id !== row.id),
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </Row>
                ))}
                {!config.locked && (
                  <AddFormRow
                    employees={employees}
                    excludeSelf
                    onAdd={(formCode) => addSelfForm(formCode)}
                    buttonLabel="Add self form"
                  />
                )}
              </Section>

              <Section
                title="2. Reviews (this person → someone else)"
                hint="Who they appraise and which document. Reviewee can be themselves or anyone else — multiple rows per person allowed."
                locked={config.locked}
              >
                {config.reviewAssignments.map((row) => {
                  const rev = employees.find((e) => e.id === row.revieweeId);
                  const isSelf = row.revieweeId === selected.id;
                  return (
                    <div key={row.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isSelf ? 'default' : 'secondary'} className="text-[10px]">
                          {isSelf ? 'Self' : 'Peer/other'}
                        </Badge>
                        <span className="text-xs font-medium">{rev?.name ?? 'Unknown'}</span>
                        <span className="text-[10px] text-muted-foreground">{formLabel(row.formCode)}</span>
                        {!config.locked && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 ml-auto"
                            onClick={() =>
                              updateConfig({
                                reviewAssignments: config.reviewAssignments.filter((r) => r.id !== row.id),
                              })
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {!config.locked && (
                        <Textarea
                          placeholder="Notes for implementer (optional)"
                          value={row.notes}
                          onChange={(e) =>
                            updateConfig({
                              reviewAssignments: config.reviewAssignments.map((r) =>
                                r.id === row.id ? { ...r, notes: e.target.value } : r,
                              ),
                            })
                          }
                          className="text-xs min-h-[48px]"
                        />
                      )}
                    </div>
                  );
                })}
                {!config.locked && (
                  <AddReviewRow
                    employees={employees}
                    reviewerId={selected.id}
                    onAdd={(revieweeId, formCode) => addReview(revieweeId, formCode)}
                  />
                )}
              </Section>

              <Section
                title="3. Comments to give (narrative)"
                hint="People this person owes written comments to (downward). Typically leaders → team. L2 members usually have none."
                locked={config.locked}
              >
                {config.commentsGive.map((row) => {
                  const rev = employees.find((e) => e.id === row.revieweeId);
                  return (
                    <Row key={row.id}>
                      <span className="text-xs">{rev?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{rev?.email}</span>
                      {!config.locked && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 ml-auto"
                          onClick={() =>
                            updateConfig({
                              commentsGive: config.commentsGive.filter((c) => c.id !== row.id),
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </Row>
                  );
                })}
                {!config.locked && (
                  <AddPersonRow
                    employees={employees.filter((e) => e.id !== selected.id)}
                    onAdd={(id) => addCommentGive(id)}
                    buttonLabel="Add comment recipient"
                  />
                )}
              </Section>

              <Section
                title="4. Comments received from"
                hint="Who may write narrative feedback about this person (they receive; cannot choose this themselves in the live app)."
                locked={config.locked}
              >
                {config.commentsReceive.map((row) => {
                  const from = employees.find((e) => e.id === row.fromEmployeeId);
                  return (
                    <Row key={row.id}>
                      <span className="text-xs">{from?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{from?.email}</span>
                      {!config.locked && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 ml-auto"
                          onClick={() =>
                            updateConfig({
                              commentsReceive: config.commentsReceive.filter((c) => c.id !== row.id),
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </Row>
                  );
                })}
                {!config.locked && (
                  <AddPersonRow
                    employees={employees.filter((e) => e.id !== selected.id)}
                    onAdd={(id) => addCommentReceive(id)}
                    buttonLabel="Add comment source"
                  />
                )}
              </Section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  locked,
  children,
}: {
  title: string;
  hint: string;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`glass-panel p-5 space-y-3 ${locked ? 'opacity-90' : ''}`}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      {children}
    </div>
  );
}

function AddFormRow({
  onAdd,
  buttonLabel,
}: {
  employees: EmployeeOption[];
  excludeSelf?: boolean;
  onAdd: (formCode: RoutingFormCode) => void;
  buttonLabel: string;
}) {
  const [formCode, setFormCode] = useState<RoutingFormCode>('monthly_self');
  return (
    <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-dashed border-border">
      <div className="space-y-1 flex-1 min-w-[180px]">
        <label className="text-[10px] uppercase text-muted-foreground">Document</label>
        <Select value={formCode} onValueChange={(v) => setFormCode(v as RoutingFormCode)}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROUTING_FORM_OPTIONS.filter((f) => f.code !== 'comments_give').map((f) => (
              <SelectItem key={f.code} value={f.code} className="text-xs">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" className="gap-1" onClick={() => onAdd(formCode)}>
        <Plus className="w-3.5 h-3.5" /> {buttonLabel}
      </Button>
    </div>
  );
}

function AddReviewRow({
  employees,
  reviewerId,
  onAdd,
}: {
  employees: EmployeeOption[];
  reviewerId: string;
  onAdd: (revieweeId: string, formCode: RoutingFormCode) => void;
}) {
  const [revieweeId, setRevieweeId] = useState(reviewerId);
  const [formCode, setFormCode] = useState<RoutingFormCode>('peer_360');

  return (
    <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-dashed border-border">
      <div className="space-y-1 flex-1 min-w-[160px]">
        <label className="text-[10px] uppercase text-muted-foreground">Reviewee</label>
        <Select value={revieweeId} onValueChange={setRevieweeId}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id} className="text-xs">
                {e.name}
                {e.id === reviewerId ? ' (self)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 flex-1 min-w-[160px]">
        <label className="text-[10px] uppercase text-muted-foreground">Document</label>
        <Select value={formCode} onValueChange={(v) => setFormCode(v as RoutingFormCode)}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROUTING_FORM_OPTIONS.map((f) => (
              <SelectItem key={f.code} value={f.code} className="text-xs">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" className="gap-1" onClick={() => onAdd(revieweeId, formCode)}>
        <Plus className="w-3.5 h-3.5" /> Add review
      </Button>
    </div>
  );
}

function AddPersonRow({
  employees,
  onAdd,
  buttonLabel,
}: {
  employees: EmployeeOption[];
  onAdd: (employeeId: string) => void;
  buttonLabel: string;
}) {
  const [personId, setPersonId] = useState(employees[0]?.id ?? '');
  if (!employees.length) return null;
  return (
    <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-dashed border-border">
      <div className="space-y-1 flex-1 min-w-[200px]">
        <label className="text-[10px] uppercase text-muted-foreground">Person</label>
        <Select value={personId} onValueChange={setPersonId}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id} className="text-xs">
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" className="gap-1" onClick={() => onAdd(personId)} disabled={!personId}>
        <Plus className="w-3.5 h-3.5" /> {buttonLabel}
      </Button>
    </div>
  );
}
