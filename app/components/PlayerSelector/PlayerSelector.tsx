interface Manager {
  name: string;
  teamName: string;
}

interface PlayerSelectorProps {
  managers: Manager[];
  selectedManager: string;
  onSelect: (managerName: string) => void;
}

export function PlayerSelector({
  managers,
  selectedManager,
  onSelect,
}: PlayerSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelect(event.target.value);
  };

  return (
    <div className="mb-6">
      <label
        htmlFor="player-selector"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Select Player ({managers.length} players)
      </label>
      <select
        id="player-selector"
        value={selectedManager}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {managers.length === 0 ? (
          <option value="">No players available</option>
        ) : (
          managers.map((manager) => (
            <option key={manager.name} value={manager.name}>
              {manager.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
