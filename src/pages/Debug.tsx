import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Bug, Loader2, RefreshCw } from 'lucide-react';

type DebugInfo = {
  profile: any;
  assignments: any[];
  logs: any[];
  classes: any[];
  enrollments: any[];
  affiliatedStudents?: any[];
};

export function Debug() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDebugInfo();
  }, [user]);

  async function loadDebugInfo() {
    try {
      if (!user) return;

      setRefreshing(true);
      setError(null);

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      let debugData: DebugInfo = {
        profile,
        assignments: [],
        logs: [],
        classes: [],
        enrollments: []
      };

      if (profile.role === 'instructor') {
        // Load affiliated students for instructors
        const { data: students, error: studentsError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            role,
            instructor_id,
            created_at,
            class_enrollments!class_enrollments_student_id_fkey (
              class:classes (
                id,
                name
              )
            ),
            skill_assignments!skill_assignments_student_id_fkey (
              id,
              skill:skills (
                id,
                name,
                skill_categories (
                  name
                )
              ),
              status,
              required_submissions,
              completed_submissions,
              due_date
            ),
            skill_logs!skill_logs_student_id_fkey (
              id,
              skill:skills (
                id,
                name
              ),
              status,
              created_at,
              evaluator_name,
              evaluator_type
            )
          `)
          .eq('instructor_id', user.id)
          .eq('role', 'student');

        if (studentsError) throw studentsError;
        debugData.affiliatedStudents = students || [];
      } else {
        // Load student-specific data
        const [assignments, logs, enrollments] = await Promise.all([
          supabase
            .from('skill_assignments')
            .select(`
              id,
              skill:skills (
                id,
                name,
                skill_categories (
                  name
                )
              ),
              status,
              required_submissions,
              completed_submissions,
              due_date,
              created_at
            `)
            .eq('student_id', user.id),
          supabase
            .from('skill_logs')
            .select(`
              id,
              skill:skills (
                id,
                name,
                skill_categories (
                  name
                )
              ),
              status,
              created_at,
              evaluator_name,
              evaluator_type,
              responses
            `)
            .eq('student_id', user.id),
          supabase
            .from('class_enrollments')
            .select(`
              id,
              enrolled_at,
              class:classes (
                id,
                name,
                description,
                start_date,
                end_date,
                instructor:profiles (
                  id,
                  full_name,
                  email
                )
              )
            `)
            .eq('student_id', user.id)
        ]);

        if (assignments.error) throw assignments.error;
        if (logs.error) throw logs.error;
        if (enrollments.error) throw enrollments.error;

        debugData = {
          ...debugData,
          assignments: assignments.data || [],
          logs: logs.data || [],
          classes: enrollments.data?.map(e => e.class) || [],
          enrollments: enrollments.data || []
        };
      }

      setDebugInfo(debugData);
    } catch (err) {
      console.error('Error loading debug info:', err);
      setError('Failed to load debug information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bug className="h-6 w-6 mr-2 text-indigo-600" />
              Debug Information
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View detailed information about your account and data for troubleshooting
            </p>
          </div>
          <button
            onClick={loadDebugInfo}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profile Data</h3>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(debugInfo.profile, null, 2)}
                </pre>
              </div>
            </div>

            {/* Affiliated Students (for instructors) */}
            {debugInfo.profile.role === 'instructor' && debugInfo.affiliatedStudents && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Affiliated Students</h3>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                    {JSON.stringify(debugInfo.affiliatedStudents, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Student-specific sections */}
            {debugInfo.profile.role === 'student' && (
              <>
                {/* Skill Assignments */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Skill Assignments</h3>
                    <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                      {JSON.stringify(debugInfo.assignments, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Skill Logs */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Skill Logs</h3>
                    <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                      {JSON.stringify(debugInfo.logs, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Class Enrollments */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Class Enrollments</h3>
                    <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                      {JSON.stringify(debugInfo.enrollments, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}