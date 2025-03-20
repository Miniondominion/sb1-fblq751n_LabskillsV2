import { Skill } from '../../../types/skills';
import { BookOpen } from 'lucide-react';

type Props = {
  skills: Skill[];
  selectedSkill: Skill | null;
  onSkillChange: (skill: Skill | null) => void;
};

export function SkillSelector({ skills, selectedSkill, onSkillChange }: Props) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="skill" className="block text-sm font-medium text-gray-700">
            Select Skill to Assign
          </label>
          <select
            id="skill"
            value={selectedSkill?.id || ''}
            onChange={(e) => {
              const skill = skills.find(s => s.id === e.target.value);
              onSkillChange(skill || null);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Choose a skill...</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name} ({skill.skill_categories.name})
              </option>
            ))}
          </select>
        </div>

        {selectedSkill && (
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
        )}
      </div>
    </div>
  );
}