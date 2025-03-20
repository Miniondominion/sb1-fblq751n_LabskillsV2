import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Loader2, FileText, Download, Filter, Search, School, Users, X } from 'lucide-react';

type SkillLog = {
  id: string;
  created_at: string;
  status: 'submitted' | 'rejected';
  student: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  skill: {
    name: string;
    skill_categories: {
      name: string;
    };
  } | null;
  class: {
    name: string;
  } | null;
  evaluator_name: string;
  evaluator_type: 'peer' | 'instructor';
};

type Class = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  full_name: string;
  email: string;
};

export function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<SkillLog[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      if (!user) return;

      const [logsResponse, classesResponse, studentsResponse] = await Promise.all([
        supabase
          .from('skill_logs')
          .select(`
            id,
            created_at,
            status,
            profiles!skill_logs_student_id_fkey (
              id,
              full_name,
              email
            ),
            skills (
              name,
              skill_categories (
                name
              )
            ),
            classes (
              name
            ),
            evaluator_name,
            evaluator_type
          `)
          .eq('profiles.affiliated_instructor', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('classes')
          .select('id, name')
          .eq('instructor_id', user.id)
          .eq('archived', false)
          .order('name'),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('affiliated_instructor', user.id)
          .eq('role', 'student')
          .order('full_name')
      ]);

      if (logsResponse.error) throw logsResponse.error;
      if (classesResponse.error) throw classesResponse.error;
      if (studentsResponse.error) throw studentsResponse.error;

      // Transform the response to match the expected type
      const transformedLogs = logsResponse.data?.map(log => ({
        ...log,
        student: log.profiles,
        skill: log.skills,
        class: log.classes
      })) || [];

      setLogs(transformedLogs);
      setClasses(classesResponse.data || []);
      setStudents(studentsResponse.data || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(student =>
    !studentSearchTerm || 
    student.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(log => {
    // Skip logs with missing required data
    if (!log.student || !log.skill) return false;

    const matchesSearch = 
      log.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'all' || log.class?.name === classes.find(c => c.id === selectedClass)?.name;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesSelectedStudents = selectedStudents.length === 0 || selectedStudents.includes(log.student.id);

    return matchesSearch && matchesClass && matchesStatus && matchesSelectedStudents;
  });

  const handleExport = () => {
    // Skip export if no logs to export
    if (filteredLogs.length === 0) return;

    const data = filteredLogs.map(log => ({
      'Student Name': log.student?.full_name || 'Unknown',
      'Student Email': log.student?.email || 'Unknown',
      'Skill': log.skill?.name || 'Unknown',
      'Category': log.skill?.skill_categories?.name || 'Unknown',
      'Class': log.class?.name || 'No Class',
      'Status': log.status,
      'Submitted': new Date(log.created_at).toLocaleDateString(),
      'Evaluator': log.evaluator_name,
      'Evaluation Type': log.evaluator_type
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage skill submissions from your students
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Reports
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

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by student or skill..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700">
                Class
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <School className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Filter by Students
              </label>
              <div className="mt-1 relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    onFocus={() => setShowStudentDropdown(true)}
                    onBlur={() => {
                      // Delay hiding the dropdown to allow for click events
                      setTimeout(() => setShowStudentDropdown(false), 200);
                    }}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search students..."
                  />
                  {selectedStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudents([])}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    </button>
                  )}
                </div>

                {/* Selected Students */}
                {selectedStudents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedStudents.map(studentId => {
                      const student = students.find(s => s.id === studentId);
                      return (
                        <span
                          key={studentId}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {student?.full_name}
                          <button
                            type="button"
                            onClick={() => setSelectedStudents(selectedStudents.filter(id => id !== studentId))}
                            className="ml-1 inline-flex items-center p-0.5 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Student Dropdown */}
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          if (!selectedStudents.includes(student.id)) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          }
                          setStudentSearchTerm('');
                        }}
                        className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${
                          selectedStudents.includes(student.id) ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="font-normal block truncate">
                            {student.full_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Skill Submissions
              </h3>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {filteredLogs.length} Reports
            </span>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skill
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evaluator
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.student?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{log.student?.email || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.skill?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{log.skill?.skill_categories?.name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.class?.name || 'No Class'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'submitted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.evaluator_name}</div>
                        <div className="text-sm text-gray-500 capitalize">{log.evaluator_type}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedClass !== 'all' || selectedStatus !== 'all' || selectedStudents.length > 0
                    ? 'Try adjusting your search or filter criteria'
                    : 'No skill submissions have been made yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}