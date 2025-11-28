import type { CaptainRegretData } from "~/utils/captain-regret";

interface CaptainRegretBadgeProps {
  regretData: CaptainRegretData;
}

export function CaptainRegretBadge({ regretData }: CaptainRegretBadgeProps) {
  // Determine severity color based on regret points
  const getSeverityColor = (regret: number) => {
    if (regret === 0) {
      return {
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-300 dark:border-green-700",
        text: "text-green-700 dark:text-green-400",
        icon: "✅",
      };
    }
    if (regret <= 6) {
      return {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-300 dark:border-yellow-700",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: "⚠️",
      };
    }
    return {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-300 dark:border-red-700",
      text: "text-red-700 dark:text-red-400",
      icon: "😭",
    };
  };

  const severity = getSeverityColor(regretData.regretPoints);

  return (
    <div
      className={`mt-3 rounded-lg border ${severity.border} ${severity.bg} p-3`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base" role="img" aria-label="captain status">
            {severity.icon}
          </span>
          <span className={`text-xs font-semibold ${severity.text}`}>
            CAPTAIN CHOICE
          </span>
        </div>
        {regretData.regretPoints > 0 && (
          <span className={`text-xs font-bold ${severity.text}`}>
            -{regretData.regretPoints} pts
          </span>
        )}
      </div>

      {/* Captain Info - Mobile Optimized */}
      <div className="space-y-2">
        {/* Your Captain */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-600 dark:text-gray-400">Captain:</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className={`font-semibold ${severity.text}`}>
              {regretData.captainName}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              ({regretData.captainPoints} × 2 = {regretData.captainTotalPoints})
            </span>
          </div>
        </div>

        {/* Best Option (if different) */}
        {regretData.regretPoints > 0 && (
          <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">
              Best choice:
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-semibold text-green-600 dark:text-green-400">
                {regretData.bestPlayerName}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ({regretData.bestPlayerPoints} × 2 ={" "}
                {regretData.bestPlayerPotentialPoints})
              </span>
            </div>
          </div>
        )}

        {/* Perfect choice message */}
        {regretData.regretPoints === 0 && (
          <div className="text-center text-xs sm:text-sm pt-1">
            <span className="font-medium text-green-600 dark:text-green-400">
              Perfect captain choice!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
