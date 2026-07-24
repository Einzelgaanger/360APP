import { useEffect, useMemo, useState } from 'react';
import MvpRoleShell from '@/components/mvp/MvpRoleShell';
import { MVP_PERIOD, MVP_ROLES } from '@/components/mvp/mvpMockData';
import type { MvpRoleId } from '@/components/mvp/mvpTypes';
import TeamMemberMvp from '@/components/mvp/views/TeamMemberMvp';
import LineManagerMvp from '@/components/mvp/views/LineManagerMvp';
import PeerReviewerMvp from '@/components/mvp/views/PeerReviewerMvp';
import GeneralManagerMvp from '@/components/mvp/views/GeneralManagerMvp';
import PeopleOpsMvp from '@/components/mvp/views/PeopleOpsMvp';
import AdminMvp from '@/components/mvp/views/AdminMvp';
import { Initials } from '@/components/mvp/MvpPrimitives';
import { cn } from '@/lib/utils';

const DEFAULT_ROLE: MvpRoleId = 'general_manager';

export default function MvpDemo() {
  const [roleId, setRoleId] = useState<MvpRoleId>(DEFAULT_ROLE);
  const role = useMemo(() => MVP_ROLES.find((r) => r.id === roleId) ?? MVP_ROLES[3], [roleId]);
  const [nav, setNav] = useState(role.nav[0]?.key ?? 'command');

  useEffect(() => {
    setNav(role.nav[0]?.key ?? 'command');
  }, [role]);

  return (
    <div className="min-h-screen bg-[hsl(var(--paper))] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl lg:h-[4.25rem]">
        <div className="h-full px-4 sm:px-6 py-2.5 lg:py-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="min-w-0 lg:justify-self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Role walkthrough · mock data · {MVP_PERIOD}
            </p>
            <h1 className="font-display text-base sm:text-lg font-semibold tracking-tight mt-0.5">
              Appraisal MVP
            </h1>
          </div>

          <div className="overflow-x-auto lg:justify-self-center max-w-full">
            <div className="flex gap-1.5 min-w-max justify-center" role="tablist" aria-label="MVP roles">
              {MVP_ROLES.map((r) => {
                const active = r.id === roleId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setRoleId(r.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-2 py-1 text-left transition-colors',
                      active
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card/70 text-foreground border-border/80 hover:border-foreground/30 hover:bg-card',
                    )}
                  >
                    <Initials
                      name={r.personaName}
                      className={cn(
                        'h-5 w-5 rounded-sm text-[8px]',
                        active ? 'bg-background/20 text-background' : 'bg-primary/10 text-primary',
                      )}
                    />
                    <span>
                      <span
                        className={cn(
                          'block text-[8px] font-mono uppercase tracking-wider leading-none',
                          active ? 'opacity-60' : 'text-muted-foreground',
                        )}
                      >
                        {r.shortLabel}
                      </span>
                      <span className="block text-[11px] font-semibold leading-tight mt-0.5">{r.tabLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="hidden lg:block text-xs text-muted-foreground max-w-[14rem] text-right leading-relaxed justify-self-end">
            Fictional org — map your own structure later.
          </p>
        </div>
      </header>

      <MvpRoleShell role={role} activeNav={nav} onNav={setNav}>
        {roleId === 'team_member' && <TeamMemberMvp nav={nav} />}
        {roleId === 'line_manager' && <LineManagerMvp nav={nav} />}
        {roleId === 'peer_reviewer' && <PeerReviewerMvp nav={nav} />}
        {roleId === 'general_manager' && <GeneralManagerMvp nav={nav} />}
        {roleId === 'people_ops' && <PeopleOpsMvp nav={nav} />}
        {roleId === 'admin' && <AdminMvp nav={nav} />}
      </MvpRoleShell>
    </div>
  );
}
