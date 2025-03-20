import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Clock, Bug, X, ChevronDown, ChevronUp } from 'lucide-react';

type SkillProgress = {
  skill_id: string;
  skill_name: string;
  category_name: string;
  required_submissions: number;
  submission_count: number;
  due_date: string | null;
  status: 'pending' | 'completed' | 'expired';
};

type DebugInfo = {
  skill_logs: any[];
  skill_assignments: any[];
};

export function SkillProgress() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadSkillProgress();
  }, [user]);

  async function loadSkillProgress() {
    try {
      if (!user) return;

      // Get all skill assignments for the user
      const { data: assignments, error: assignmentsError } = await supabase
        .from('skill_assignments')
        .select(`
          skill_id,
          required_submissions,
          due_date,
          status,
          skills (
            name,
            skill_categories (
              name
            )
          )
        `)
        .eq('student_id', user.id);

      if (assignmentsError) throw assignmentsError;

      // Get all submitted skill logs for this user
      const { data: logs, error: logsError } = await supabase
        .from('skill_logs')
        .select('skill_id')
        .eq('student_id', user.id)
        .eq('status', 'submitted');

      if (logsError) throw logsError;

      // Count submitted submissions for each skill
      const submissionCounts = (logs || []).reduce((acc: { [key: string]: number }, log) => {
        acc[log.skill_id] = (acc[log.skill_id] || 0) + 1;
        return acc;
      }, {});

      // Combine the data
      const progress = (assignments || []).map(assignment => ({
        skill_id: assignment.skill_id,
        skill_name: assignment.skills.name,
        category_name: assignment.skills.skill_categories.name,
        required_submissions: assignment.required_submissions,
        submission_count: submissionCounts[assignment.skill_id] || 0,
        due_date: assignment.due_date,
        status: assignment.status
      }));

      setSkillProgress(progress);
    } catch (err) {
      console.error('Error loading skill progress:', err);
      setError('Failed to load skill progress');
    } finally {
      setLoading(false);
    }
  }

  function getStatusText(status: string, submissionCount: number, requiredSubmissions: number): string {
    if (status === 'expired') return 'Expired';
    if (status === 'completed') return 'Completed';
    return submissionCount < requiredSubmissions ? 'Incomplete' : 'Completed';
  }

  function getStatusClasses(status: string, submissionCount: number, requiredSubmissions: number): string {
    if (status === 'expired') return 'bg-red-100 text-red-800';
    if (status === 'completed' || submissionCount >= requiredSubmissions) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  function getProgressBarColor(status: string, submissionCount: number, requiredSubmissions: number): string {
    if (status === 'expired') return 'bg-red-600';
    if (status === 'completed' || submissionCount >= requiredSubmissions) return 'bg-green-600';
    return 'bg-yellow-600';
  }

  function calculateProgressPercentage(submissionCount: number, requiredSubmissions: number): number {
    return Math.min((submissionCount / requiredSubmissions) * 100, 100);
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (skillProgress.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">Skills Progress</h3>
            <p className="ml-2 text-sm text-gray-500">
              ({skillProgress.length} skill{skillProgress.length !== 1 ? 's' : ''})
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDebug();
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug Info
            </button>
            {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200">
            <div className="max-h-[360px] overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {skillProgress.map((skill) => (
                  <div key={skill.skill_id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{skill.skill_name}</h4>
                          <p className="text-sm text-gray-500">{skill.category_name}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          {skill.due_date && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Due: {new Date(skill.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusClasses(skill.status, skill.submission_count, skill.required_submissions)
                          }`}>
                            {getStatusText(skill.status, skill.submission_count, skill.required_submissions)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block text-gray-600">
                              {skill.submission_count} of {skill.required_submissions} submissions
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-gray-600">
                              {Math.round(calculateProgressPercentage(skill.submission_count, skill.required_submissions))}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                          <div
                            style={{ width: `${calculateProgressPercentage(skill.submission_count, skill.required_submissions)}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                              getProgressBarColor(skill.status, skill.submission_count, skill.required_submissions)
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug Information Modal */}
      {showDebug && debugInfo && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Debug Information</h3>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Skill Logs */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Skill Logs</h4>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(debugInfo.skill_logs, null, 2)}
                </pre>
              </div>

              {/* Skill Assignments */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Skill Assignments</h4>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(debugInfo.skill_assignments, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}