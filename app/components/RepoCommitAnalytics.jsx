"use client";

export default function RepoCommitAnalytics({ weeks }) {
  if (!weeks || weeks.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No commit activity available.
      </div>
    );
  }

  /* ---------- BAR CHART ---------- */
  const last24Weeks = weeks.slice(-24);
  const maxCommits = Math.max(
    ...last24Weeks.map((w) => w.total),
    1
  );

  /* ---------- HEATMAP ---------- */
  const heatmap = weeks.slice(-12).flatMap((w) => w.days);

  const getColor = (count) => {
    if (count === 0) return "bg-gray-800";
    if (count < 3) return "bg-green-900";
    if (count < 6) return "bg-green-700";
    if (count < 10) return "bg-green-500";
    return "bg-green-400";
  };

  return (
    <div className="space-y-6">
      {/* ================= BAR CHART ================= */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold mb-4">
          Weekly Commits (6 Months)
        </h3>

        {/* Scroll container */}
        <div className="overflow-x-auto">
          <div className="flex items-end gap-3 h-40 min-w-[600px]">
            {last24Weeks.map((w, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                {/* Bar */}
                <div
                  className="w-4 bg-indigo-500/80 rounded-sm hover:bg-indigo-400 transition"
                  style={{
                    height: `${(w.total / maxCommits) * 100}%`,
                  }}
                  title={`Week ${i + 1}: ${w.total} commits`}
                />

                {/* Label */}
                <span className="text-[10px] text-gray-400">
                  W{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <p className="mt-3 text-xs text-gray-400">
          Each bar represents total commits in a week
        </p>
      </div>

      {/* ================= HEATMAP ================= */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold mb-4">
          Commit Heatmap (12 Weeks)
        </h3>

        {/* Scroll on mobile */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 w-fit min-w-[280px]">
            {heatmap.map((count, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded ${getColor(count)}`}
                title={`${count} commits`}
              />
            ))}
          </div>
        </div>

        {/* Heatmap legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>Less</span>
          <div className="w-4 h-4 bg-gray-800 rounded" />
          <div className="w-4 h-4 bg-green-900 rounded" />
          <div className="w-4 h-4 bg-green-700 rounded" />
          <div className="w-4 h-4 bg-green-500 rounded" />
          <div className="w-4 h-4 bg-green-400 rounded" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
