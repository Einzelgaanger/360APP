import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppraisalData } from '@/hooks/useAppraisalData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatsCard from '@/components/dashboard/StatsCard';
import ManagerLeaderboard from '@/components/dashboard/ManagerLeaderboard';
import CompetencyRadar from '@/components/dashboard/CompetencyRadar';
import ScoreDistributionChart from '@/components/dashboard/ScoreDistributionChart';
import RelationshipPieChart from '@/components/dashboard/RelationshipPieChart';
import FeedbackThemes from '@/components/dashboard/FeedbackThemes';
import ManagerDetailPanel from '@/components/dashboard/ManagerDetailPanel';
import FilterPanel from '@/components/dashboard/FilterPanel';
import ExportButton from '@/components/dashboard/ExportButton';
import AIChatPanel from '@/components/dashboard/AIChatPanel';
import { Button } from '@/components/ui/button';
import { ManagerSummary } from '@/types/appraisal';
import { BarChart3, Users, Trophy, Target, Zap, LogOut, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    responses, managerSummaries, competencyScores, relationshipDistribution,
    scoreDistribution, feedbackThemes, overallStats, uniqueManagers,
    uniqueRelationships, loading, error, filters, setFilters
  } = useAppraisalData();

  const [selectedManager, setSelectedManager] = useState<ManagerSummary | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const dataContext = useMemo(() => {
    if (!managerSummaries.length) return '';
    return `Total Responses: ${overallStats.totalResponses}
Total Managers: ${overallStats.totalManagers}
Average Score: ${overallStats.avgOverallScore}/4.0

Top 5 Managers:
${managerSummaries.slice(0, 5).map((m, i) => 
  `${i+1}. ${m.manager_name}: ${m.overall_score.toFixed(2)} (${m.total_responses} reviews)`
).join('\n')}

Lowest 3 Performers:
${managerSummaries.slice(-3).reverse().map(m => 
  `- ${m.manager_name}: ${m.overall_score.toFixed(2)}`
).join('\n')}

Competency Averages:
${competencyScores.map(c => `- ${c.name}: ${c.score.toFixed(2)}/4.0`).join('\n')}`;
  }, [managerSummaries, overallStats, competencyScores]);

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold">VGG 360° Analytics</h1>
              <p className="text-xs text-muted-foreground">Performance Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FilterPanel filters={filters} setFilters={setFilters} uniqueManagers={uniqueManagers} uniqueRelationships={uniqueRelationships} />
            <ExportButton managers={managerSummaries} responses={responses} />
            <Button onClick={() => setChatOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Zap className="w-4 h-4" /> Analytics Copilot
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Responses" value={overallStats.totalResponses} icon={Users} variant="default" delay={0} />
          <StatsCard title="Managers Evaluated" value={overallStats.totalManagers} icon={Target} variant="primary" delay={0.1} />
          <StatsCard title="Average Score" value={`${overallStats.avgOverallScore}/4.0`} subtitle={`${((overallStats.avgOverallScore/4)*100).toFixed(0)}% performance`} icon={BarChart3} variant="accent" delay={0.2} />
          <StatsCard title="Top Performer" value={overallStats.topPerformer} subtitle={`Score: ${overallStats.topScore.toFixed(2)}`} icon={Trophy} variant="success" delay={0.3} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1"><ManagerLeaderboard managers={managerSummaries} onSelectManager={setSelectedManager} selectedManager={selectedManager?.manager_name} /></div>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CompetencyRadar competencies={competencyScores} />
              <ScoreDistributionChart distribution={scoreDistribution} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RelationshipPieChart distribution={relationshipDistribution} />
              <FeedbackThemes themes={feedbackThemes} />
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedManager && <ManagerDetailPanel manager={selectedManager} onClose={() => setSelectedManager(null)} />}
      </AnimatePresence>
      <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} dataContext={dataContext} />
    </div>
  );
}