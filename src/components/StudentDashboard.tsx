import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, LineChart as ChartLine, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SkillProgress } from './skills/SkillProgress';

type SkillSummary = {
  total: number;
};

export function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skillSummary, setSkillSummary] = useState<SkillSummary>({
    total: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    try {
      if (!user) return;

      // Get assignments to count total unique skills
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('skill_assignments')
        .select('skill_id')
        .eq('student_id', user.id);

      if (assignmentsError) throw assignmentsError;

      // Count unique skills
      const uniqueSkills = new Set(assignmentsData?.map(a => a.skill_id) || []);

      setSkillSummary({
        total: uniqueSkills.size
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Achievement Tracking
                  </dt>
                  <dd className="text-sm text-gray-500">
                    Coming soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartLine className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Progress Analytics
                  </dt>
                  <dd className="text-sm text-gray-500">
                    Coming soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Upcoming Deadlines
                  </dt>
                  <dd className="text-sm text-gray-500">
                    Coming soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Skills
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {skillSummary.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Progress */}
      <SkillProgress />
    </div>
  );
}