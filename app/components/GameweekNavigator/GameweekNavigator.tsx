interface GameweekNavigatorProps {
  currentGameweek: number;
  availableGameweeks: number[];
  onNavigate: (gameweek: number) => void;
}

export function GameweekNavigator({
  currentGameweek,
  availableGameweeks,
  onNavigate,
}: GameweekNavigatorProps) {
  const currentIndex = availableGameweeks.indexOf(currentGameweek);
  const isFirstGameweek = currentIndex === 0 || availableGameweeks.length === 0;
  const isLastGameweek =
    currentIndex === availableGameweeks.length - 1 ||
    availableGameweeks.length === 0;

  const handlePrevious = () => {
    if (!isFirstGameweek && currentIndex > 0) {
      onNavigate(availableGameweeks[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (!isLastGameweek && currentIndex < availableGameweeks.length - 1) {
      onNavigate(availableGameweeks[currentIndex + 1]);
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const gameweek = parseInt(event.target.value, 10);
    onNavigate(gameweek);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={isFirstGameweek}
          aria-label="Previous gameweek"
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors w-full sm:w-auto"
        >
          ◄ Previous
        </button>

        {/* Current Gameweek Display & Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full sm:w-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            Gameweek {currentGameweek}
          </h2>

          <select
            value={currentGameweek}
            onChange={handleSelectChange}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
          >
            {availableGameweeks.length === 0 ? (
              <option value={currentGameweek}>GW {currentGameweek}</option>
            ) : (
              availableGameweeks.map((gw) => (
                <option key={gw} value={gw}>
                  GW {gw}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isLastGameweek}
          aria-label="Next gameweek"
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors w-full sm:w-auto"
        >
          Next ►
        </button>
      </div>
    </div>
  );
}
