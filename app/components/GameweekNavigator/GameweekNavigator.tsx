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
    <div className="kit-card p-5 kit-animate-slide-up" style={{ "--delay": "200ms" } as React.CSSProperties}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={isFirstGameweek}
          aria-label="Previous gameweek"
          className="px-5 py-2.5 rounded-full font-semibold text-sm transition-colors w-full sm:w-auto disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: isFirstGameweek ? "#e5e7eb" : "var(--color-page-standings, #059669)",
            color: isFirstGameweek ? "#9ca3af" : "white",
          }}
        >
          ◄ Previous
        </button>

        {/* Current Gameweek Display & Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full sm:w-auto">
          <h2 className="whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#1a1a1a" }}>
            Gameweek {currentGameweek}
          </h2>

          <select
            value={currentGameweek}
            onChange={handleSelectChange}
            className="px-4 py-2 border border-gray-200 rounded-full bg-white text-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-auto"
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
          className="px-5 py-2.5 rounded-full font-semibold text-sm transition-colors w-full sm:w-auto disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: isLastGameweek ? "#e5e7eb" : "var(--color-page-standings, #059669)",
            color: isLastGameweek ? "#9ca3af" : "white",
          }}
        >
          Next ►
        </button>
      </div>
    </div>
  );
}
