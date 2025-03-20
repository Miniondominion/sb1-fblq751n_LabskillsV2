type Props = {
  activeTab: 'unassigned' | 'assigned';
  unassignedCount: number;
  assignedCount: number;
  onTabChange: (tab: 'unassigned' | 'assigned') => void;
};

export function AssignmentTabs({ activeTab, unassignedCount, assignedCount, onTabChange }: Props) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex" aria-label="Tabs">
        <button
          onClick={() => onTabChange('unassigned')}
          className={`${
            activeTab === 'unassigned'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
        >
          Unassigned Students ({unassignedCount})
        </button>
        <button
          onClick={() => onTabChange('assigned')}
          className={`${
            activeTab === 'assigned'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
        >
          Assigned Students ({assignedCount})
        </button>
      </nav>
    </div>
  );
}