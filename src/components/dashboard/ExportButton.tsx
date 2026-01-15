import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ManagerSummary, AppraisalResponse } from '@/types/appraisal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  managers: ManagerSummary[];
  responses: AppraisalResponse[];
}

export default function ExportButton({ managers, responses }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportToExcel = () => {
    setExporting(true);
    
    try {
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = managers.map(m => ({
        'Manager Name': m.manager_name,
        'Total Reviews': m.total_responses,
        'Team Leadership': m.avg_team_leadership,
        'Results Orientation': m.avg_results_orientation,
        'Cultural Fit': m.avg_cultural_fit,
        'Overall Score': m.overall_score,
        'Score %': ((m.overall_score / 4) * 100).toFixed(1) + '%',
      }));
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Manager Summary');
      
      // Detailed responses sheet
      const responseData = responses.map(r => ({
        'Timestamp': r.timestamp || '',
        'Manager': r.manager_name,
        'Relationship': r.relationship || '',
        'Mentors/Coaches': r.mentors_coaches_score,
        'Effective Direction': r.effective_direction_score,
        'Establishes Rapport': r.establishes_rapport_score,
        'Clear Goals': r.sets_clear_goals_score,
        'Open to Ideas': r.open_to_ideas_score,
        'Team Leadership Comments': r.team_leadership_comments || '',
        'Sense of Urgency': r.sense_of_urgency_score,
        'Analyzes Change': r.analyzes_change_score,
        'Confidence/Integrity': r.confidence_integrity_score,
        'Results Comments': r.results_orientation_comments || '',
        'Patient/Humble': r.patient_humble_score,
        'Flat Collaborative': r.flat_collaborative_score,
        'Approachable': r.approachable_score,
        'Empowers Team': r.empowers_team_score,
        'Final Say': r.final_say_score,
        'Cultural Fit Comments': r.cultural_fit_comments || '',
        'Stop Doing': r.stop_doing || '',
        'Start Doing': r.start_doing || '',
        'Continue Doing': r.continue_doing || '',
      }));
      
      const responseSheet = XLSX.utils.json_to_sheet(responseData);
      XLSX.utils.book_append_sheet(wb, responseSheet, 'All Responses');
      
      XLSX.writeFile(wb, `VGG_360_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('VGG 360° Performance Analytics', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Total Managers: ${managers.length} | Total Responses: ${responses.length}`, 14, 34);
      
      // Manager Summary Table
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Manager Performance Summary', 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Manager', 'Reviews', 'Team Lead', 'Results', 'Culture', 'Overall', '%']],
        body: managers.slice(0, 20).map(m => [
          m.manager_name,
          m.total_responses.toString(),
          m.avg_team_leadership.toFixed(2),
          m.avg_results_orientation.toFixed(2),
          m.avg_cultural_fit.toFixed(2),
          m.overall_score.toFixed(2),
          ((m.overall_score / 4) * 100).toFixed(0) + '%',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 139, 139] },
      });
      
      doc.save(`VGG_360_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        disabled={exporting}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full right-0 mt-2 w-48 glass-card shadow-2xl z-50 p-2"
            >
              <button
                onClick={exportToExcel}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <FileSpreadsheet className="w-5 h-5 text-success" />
                <div className="text-left">
                  <p className="text-sm font-medium">Excel (.xlsx)</p>
                  <p className="text-xs text-muted-foreground">Full data export</p>
                </div>
              </button>
              
              <button
                onClick={exportToPDF}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <FileText className="w-5 h-5 text-destructive" />
                <div className="text-left">
                  <p className="text-sm font-medium">PDF Report</p>
                  <p className="text-xs text-muted-foreground">Summary report</p>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}