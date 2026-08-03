import { useEffect, useState } from "react";

const REFRESH_INTERVAL = 30000;

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms) {
  if (ms == null) return "-";

  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }

  return `${ms} ms`;
}

function statusColor(status) {
  switch (status) {
    case "SUCCESS":
      return "bg-green-500/20 text-green-400 border border-green-500/30";

    case "FAILED":
      return "bg-red-500/20 text-red-400 border border-red-500/30";

    default:
      return "bg-slate-700 text-slate-300";
  }
}

export default function SchedulerMonitor() {
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    summary: {},
    runs: [],
  });

  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [countdown, setCountdown] = useState(30);

  async function loadData() {
    try {
      const response = await fetch("/api/scheduler-monitor");

      if (!response.ok) {
        throw new Error("API Error");
      }

      const json = await response.json();

      setData(json);

      setLastRefresh(new Date());

      setCountdown(30);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const refreshTimer = setInterval(loadData, REFRESH_INTERVAL);

    const countdownTimer = setInterval(() => {
      setCountdown((v) => (v > 0 ? v - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(countdownTimer);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl">
        Scheduler Monitor laden...
      </div>
    );
  }

  const summary = data.summary || {};

  const runs = data.runs || [];
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">
              Scheduler Monitor
            </h1>

            <p className="text-slate-400 mt-3 text-lg">
              Live monitoring van alle FuelAlert scrapers.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-5 text-right min-w-[280px]">
            <div className="text-slate-400 text-sm">Laatste refresh</div>

            <div className="text-xl font-semibold mt-1">
              {formatDate(lastRefresh)}
            </div>

            <div className="border-t border-slate-800 my-4"></div>

            <div className="text-slate-400 text-sm">Volgende refresh</div>

            <div className="text-2xl font-bold text-amber-400 mt-1">
              {countdown}s
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm uppercase tracking-wide">
              Runs vandaag
            </div>

            <div className="text-5xl font-bold mt-4">
              {summary.totalRuns ?? 0}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm uppercase tracking-wide">
              Success
            </div>

            <div className="text-5xl font-bold text-green-400 mt-4">
              {summary.successRuns ?? 0}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm uppercase tracking-wide">
              Failed
            </div>

            <div className="text-5xl font-bold text-red-400 mt-4">
              {summary.failedRuns ?? 0}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm uppercase tracking-wide">
              Gemiddelde duur
            </div>

            <div className="text-5xl font-bold mt-4">
              {formatDuration(summary.averageDuration)}
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Laatste uitgevoerde run</h2>

            {summary.lastRun && (
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColor(summary.lastRun.status)}`}
              >
                {summary.lastRun.status}
              </span>
            )}
          </div>

          {summary.lastRun ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <div className="text-slate-500 text-xs uppercase mb-2">
                  Scraper
                </div>

                <div className="text-xl font-bold">
                  {summary.lastRun.scraper}
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-xs uppercase mb-2">
                  Stations
                </div>

                <div className="text-3xl font-bold text-amber-400">
                  {summary.lastRun.stations}
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-xs uppercase mb-2">
                  Updated
                </div>

                <div className="text-3xl font-bold text-green-400">
                  {summary.lastRun.updated}
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-xs uppercase mb-2">
                  Errors
                </div>

                <div
                  className={`text-3xl font-bold ${
                    summary.lastRun.errors > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {summary.lastRun.errors}
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-xs uppercase mb-2">
                  Duur
                </div>

                <div className="text-3xl font-bold">
                  {formatDuration(summary.lastRun.duration_ms)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">
              Nog geen scheduler-run uitgevoerd.
            </div>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Historiek</h2>

              <p className="text-slate-400 text-sm mt-1">
                Laatste scheduler-runs
              </p>
            </div>

            <div className="text-slate-400 text-sm">{runs.length} runs</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wide">
                  <th className="px-6 py-4 text-left">Start</th>

                  <th className="px-6 py-4 text-left">Scraper</th>

                  <th className="px-6 py-4 text-center">Status</th>

                  <th className="px-6 py-4 text-right">Stations</th>

                  <th className="px-6 py-4 text-right">Inserted</th>

                  <th className="px-6 py-4 text-right">Updated</th>

                  <th className="px-6 py-4 text-right">Skipped</th>

                  <th className="px-6 py-4 text-right">Duplicates</th>

                  <th className="px-6 py-4 text-right">Errors</th>

                  <th className="px-6 py-4 text-right">Duration</th>
                </tr>
              </thead>

              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-20 text-slate-500"
                    >
                      Nog geen scheduler-runs geregistreerd.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr
                      key={run.id}
                      className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        {formatDate(run.started_at)}
                      </td>

                      <td className="px-6 py-5 font-semibold">{run.scraper}</td>

                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusColor(run.status)}`}
                        >
                          {run.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">{run.stations}</td>

                      <td className="px-6 py-5 text-right text-green-400">
                        {run.inserted}
                      </td>

                      <td className="px-6 py-5 text-right text-cyan-400">
                        {run.updated}
                      </td>

                      <td className="px-6 py-5 text-right">{run.skipped}</td>

                      <td className="px-6 py-5 text-right">{run.duplicates}</td>

                      <td
                        className={`px-6 py-5 text-right font-semibold ${
                          run.errors > 0 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {run.errors}
                      </td>

                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        {formatDuration(run.duration_ms)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between text-sm text-slate-500 gap-3">
          <div>FuelAlert Belgium • Scheduler Monitor • Backend v8.5</div>

          <div className="flex items-center gap-6">
            <span>
              Refresh elke <strong className="text-slate-300">30 sec</strong>
            </span>

            <span>
              Laatste update{" "}
              <strong className="text-slate-300">
                {formatDate(lastRefresh)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
