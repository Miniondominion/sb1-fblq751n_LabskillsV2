import { Eye, Pencil, Trash2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Skill, Instructor } from '../../types/skills';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Props = {
  skills: Skill[];
  instructors: Instructor[];
  onEdit?: (skill: Skill) => void;
  onDelete?: (skillId: string) => Promise<void>;
  onPreview: (skill: Skill) => void;
  userRole?: 'admin' | 'instructor';
};

export function SkillsTable({
  skills,
  onEdit,
  onDelete,
  onPreview,
  userRole,
}: Props) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const handleSkillClick = (skill: Skill) => {
    if (userRole === 'instructor') {
      navigate(`/skills/${skill.id}/assign`);
    }
  };

  const displayedSkills = showAll ? skills : skills.slice(0, 5);

  return (
    <div className="flex flex-col">
      <div className="min-w-full divide-y divide-gray-200 bg-white">
        <div className={`overflow-y-auto ${!showAll ? 'max-h-[400px]' : ''}`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedSkills.map((skill) => (
                <tr 
                  key={skill.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleSkillClick(skill)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {skill.name}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {skill.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {skill.skill_categories.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {skill.form_schema?.questions.length || 0} questions
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(skill);
                      }}
                      className="mt-1 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview Form
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {userRole === 'admin' ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(skill);
                          }}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(skill.id);
                          }}
                          className="inline-flex items-center text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/skills/${skill.id}/assign`);
                        }}
                        className="inline-flex items-center text-green-600 hover:text-green-900 transition-colors"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {displayedSkills.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-gray-500 text-sm">No skills available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Show More/Less Button */}
      {skills.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All ({skills.length} skills)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}