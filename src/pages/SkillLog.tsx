import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, Loader2, BookOpen, Clock, History, Star, ChevronDown, Search, Users, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { RecentSkillsGrid } from '../components/skills/RecentSkillsGrid';

type Question = {
  id: string;
  question_text: string;
  response_type: 'checkbox' | 'text' | 'number' | 'multiple_choice';
  is_required: boolean;
  options?: string[];
};

type Skill = {
  id: string;
  name: string;
  description: string;
  verification_type: 'peer' | 'instructor';
  form_schema: {
    questions: Question[];
  };
  skill_categories: {
    name: string;
  };
};

type ClassEnrollment = {
  class_id: string;
  class: {
    name: string;
  };
};

type Classmate = {
  student_id: string;
  full_name: string;
  email: string;
  class_id: string;
  class_name: string;
};

export function SkillLog() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [responses, setResponses] = useState<{ [key: string]: string | boolean }>({});
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [verificationType, setVerificationType] = useState<'peer' | 'instructor'>('peer');
  const [evaluatorName, setEvaluatorName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [classEnrollment, setClassEnrollment] = useState<ClassEnrollment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [selectedClassmate, setSelectedClassmate] = useState<Classmate | null>(null);
  const [showClassmateDropdown, setShowClassmateDropdown] = useState(false);
  const [classmateSearchTerm, setClassmateSearchTerm] = useState('');
  const [showSkillSelector, setShowSkillSelector] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const classmateSearchRef = useRef<HTMLDivElement>(null);
  let signaturePad: SignatureCanvas | null = null;

  useEffect(() => {
    loadSkills();
    loadClassEnrollment();
    loadClassmates();
  }, [user]);

  useEffect(() => {
    if (selectedSkill) {
      loadAttemptNumber();
      setVerificationType(selectedSkill.verification_type);
      setShowSkillSelector(false);
    }
  }, [selectedSkill]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSkillDropdown(false);
      }
      if (classmateSearchRef.current && !classmateSearchRef.current.contains(event.target as Node)) {
        setShowClassmateDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function loadSkills() {
    try {
      if (!user) return;

      const { data: assignedSkills, error } = await supabase
        .from('skill_assignments')
        .select(`
          skill_id,
          skills (
            id,
            name,
            description,
            verification_type,
            form_schema,
            skill_categories (
              name
            )
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const uniqueSkills = assignedSkills
        ?.map(assignment => assignment.skills)
        .filter((skill): skill is Skill => skill !== null);

      setSkills(uniqueSkills || []);
    } catch (err) {
      console.error('Error loading skills:', err);
      setError('Failed to load assigned skills');
    } finally {
      setLoading(false);
    }
  }

  async function loadClassEnrollment() {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          class_id,
          class:classes (
            name
          )
        `)
        .eq('student_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setClassEnrollment(data);
    } catch (err) {
      console.error('Error loading class enrollment:', err);
    }
  }

  async function loadClassmates() {
    try {
      if (!user) return;

      const { data, error } = await supabase.rpc('get_student_classmates', {
        p_student_id: user.id
      });

      if (error) throw error;
      setClassmates(data || []);
    } catch (err) {
      console.error('Error loading classmates:', err);
      setError('Failed to load classmates');
    }
  }

  async function loadAttemptNumber() {
    if (!selectedSkill || !user) return;

    try {
      const { count, error } = await supabase
        .from('skill_logs')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', selectedSkill.id)
        .eq('student_id', user.id);

      if (error) throw error;

      setAttemptNumber((count || 0) + 1);
    } catch (err) {
      console.error('Error loading attempt number:', err);
      setAttemptNumber(1);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSkill || !user) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (!evaluatorName.trim()) {
        setError('Please provide the evaluator\'s name');
        return;
      }

      if (verificationType === 'instructor' && !signatureData) {
        setError('Instructor signature is required');
        return;
      }

      const missingRequired = selectedSkill.form_schema.questions
        .filter(q => q.is_required)
        .find(q => !responses[q.id]);

      if (missingRequired) {
        setError('Please fill in all required fields');
        return;
      }

      // Determine the student_id and evaluated_student_id based on whether this is a peer evaluation
      const logData = {
        skill_id: selectedSkill.id,
        student_id: selectedClassmate ? selectedClassmate.student_id : user.id,
        evaluated_student_id: selectedClassmate ? user.id : null,
        class_id: classEnrollment?.class_id || null,
        responses: responses,
        status: 'submitted',
        attempt_number: attemptNumber,
        evaluator_name: evaluatorName,
        evaluator_type: verificationType,
        instructor_signature: verificationType === 'instructor' ? signatureData : null
      };

      const { error: logError } = await supabase
        .from('skill_logs')
        .insert([logData]);

      if (logError) throw logError;

      setSuccess('Skill log submitted successfully');
      setSelectedSkill(null);
      setResponses({});
      setEvaluatorName('');
      setSignatureData(null);
      setSelectedClassmate(null);
      setShowSkillSelector(true);
      await loadSkills();
    } catch (err) {
      console.error('Error submitting skill log:', err);
      setError('Failed to submit skill log');
    } finally {
      setSubmitting(false);
    }
  }

  const handleBackToSkillSelection = () => {
    setSelectedSkill(null);
    setResponses({});
    setEvaluatorName('');
    setSignatureData(null);
    setSelectedClassmate(null);
    setShowSkillSelector(true);
  };

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.skill_categories.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClassmates = classmates.filter(classmate =>
    !classmateSearchTerm || 
    classmate.full_name.toLowerCase().includes(classmateSearchTerm.toLowerCase()) ||
    classmate.email.toLowerCase().includes(classmateSearchTerm.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Log Skill</h1>
            <p className="mt-1 text-sm text-gray-500">
              Document your progress on assigned skills
            </p>
          </div>
          {!showSkillSelector && (
            <button
              onClick={handleBackToSkillSelection}
              className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          )}
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

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {skills.length > 0 ? (
          <>
            {showSkillSelector ? (
              <>
                {/* Recent and Frequent Skills Grid */}
                <RecentSkillsGrid 
                  userId={user?.id}
                  onSelectSkill={setSelectedSkill}
                />

                {/* Skill Selection */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="skill" className="block text-sm font-medium text-gray-700">
                        Select Skill to Log
                      </label>
                      <div className="mt-1 relative" ref={searchRef}>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setShowSkillDropdown(true)}
                            placeholder="Search skills..."
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 py-3 sm:text-sm border-gray-300 rounded-lg"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>

                        {showSkillDropdown && filteredSkills.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {filteredSkills.map((skill) => (
                              <div
                                key={skill.id}
                                onClick={() => {
                                  setSelectedSkill(skill);
                                  setSearchTerm('');
                                  setShowSkillDropdown(false);
                                }}
                                className="cursor-pointer group relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                              >
                                <div className="flex items-center">
                                  <span className="font-medium block truncate">
                                    {skill.name}
                                  </span>
                                  <span className="ml-2 text-sm text-gray-500">
                                    ({skill.skill_categories.name})
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
              </>
            ) : selectedSkill && (
              <>
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
                      <div className="flex">
                        <BookOpen className="h-5 w-5 text-indigo-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-indigo-800">
                            {selectedSkill.name}
                          </h3>
                          <p className="mt-1 text-sm text-indigo-700">
                            {selectedSkill.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Student Selection */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-purple-700">
                        Select Student to Evaluate (Optional)
                      </label>
                      <div className="mt-1 relative" ref={classmateSearchRef}>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={classmateSearchTerm}
                            onChange={(e) => setClassmateSearchTerm(e.target.value)}
                            onFocus={() => setShowClassmateDropdown(true)}
                            placeholder="Search classmates..."
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 py-3 sm:text-sm border-gray-300 rounded-lg"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>

                        {showClassmateDropdown && filteredClassmates.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {filteredClassmates.map((classmate) => (
                              <div
                                key={classmate.student_id}
                                onClick={() => {
                                  setSelectedClassmate(classmate);
                                  setClassmateSearchTerm('');
                                  setShowClassmateDropdown(false);
                                }}
                                className="cursor-pointer group relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium block truncate">
                                    {classmate.full_name}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {classmate.class_name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedClassmate && (
                        <div className="mt-2 flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-indigo-800">
                              Evaluating: {selectedClassmate.full_name}
                            </p>
                            <p className="text-xs text-indigo-600">
                              Class: {selectedClassmate.class_name}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedClassmate(null)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Verification Type Selection */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Type <span className="text-red-500">*</span>
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="peer"
                            checked={verificationType === 'peer'}
                            onChange={(e) => setVerificationType(e.target.value as 'peer' | 'instructor')}
                            className="border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-offset-0"
                          />
                          <span className="ml-2 text-sm text-gray-700">Peer Verification</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="instructor"
                            checked={verificationType === 'instructor'}
                            onChange={(e) => setVerificationType(e.target.value as 'peer' | 'instructor')}
                            className="border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-offset-0"
                          />
                          <span className="ml-2 text-sm text-gray-700">Instructor Verification</span>
                        </label>
                      </div>
                    </div>

                    {/* Evaluator Name Field */}
                    <div className="mt-4">
                      <label htmlFor="evaluatorName" className="block text-sm font-medium text-gray-700">
                        {verificationType === 'peer' ? 'Peer Evaluator Name' : 'Instructor Name'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="evaluatorName"
                        value={evaluatorName}
                        onChange={(e) => setEvaluatorName(e.target.value)}
                        placeholder={`Enter ${verificationType === 'peer' ? 'peer evaluator' : 'instructor'}'s name`}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Form Questions */}
                  {selectedSkill.form_schema.questions.map((question) => (
                    <div key={question.id} className="bg-white shadow rounded-lg p-6">
                      <label className="block text-sm font-medium text-gray-700">
                        {question.question_text}
                        {question.is_required && <span className="text-red-500 ml-1">*</span>}
                        
                      </label>

                      {question.response_type === 'text' && (
                        <input
                          type="text"
                          value={responses[question.id] as string || ''}
                          onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required={question.is_required}
                        />
                      )}

                      {question.response_type === 'number' && (
                        <input
                          type="number"
                          value={responses[question.id] as string || ''}
                          onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required={question.is_required}
                        />
                      )}

                      {question.response_type === 'checkbox' && (
                        <div className="mt-1">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={responses[question.id] as boolean || false}
                              onChange={(e) => setResponses({ ...responses, [question.id]: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-offset-0"
                              required={question.is_required}
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                        </div>
                      )}

                      {question.response_type === 'multiple_choice' && (
                        <div className="mt-2 space-y-2">
                          {question.options?.map((option, index) => (
                            <label key={index} className="inline-flex items-center block">
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={responses[question.id] === option}
                                onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                                className="border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-offset-0"
                                required={question.is_required}
                              />
                              <span className="ml-2 text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Signature Panel - Only shown for instructor verification */}
                  {verificationType === 'instructor' && (
                    <div className="bg-white shadow rounded-lg p-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructor Signature <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 block w-full h-48 border-2 border-gray-300 rounded-md">
                        <SignatureCanvas
                          ref={(ref) => { signaturePad = ref }}
                          canvasProps={{
                            className: 'w-full h-full'
                          }}
                          onEnd={() => {
                            if (signaturePad) {
                              setSignatureData(signaturePad.toDataURL());
                            }
                          }}
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (signaturePad) {
                              signaturePad.clear();
                              setSignatureData(null);
                            }
                          }}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Clear Signature
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Skill'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No skills assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any skills assigned to you yet.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}