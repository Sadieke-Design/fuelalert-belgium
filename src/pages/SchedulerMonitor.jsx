import { useEffect, useState } from "react";

const REFRESH_INTERVAL = 30000;

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const badgeClass = (status) =>
  status === "SUCCESS"
    ? "bg-green-100 text-green-700 border border-green-300"
    : "bg-red-100 text-red-700 border border-red-300";

export default function SchedulerMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  async function loadData() {
    try {
      const res = await fetch("/api/scheduler-monitor");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      setData(json);
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (err) {
      console.error(err);

      setData({
        summary: {
          totalRuns: 0,
          successRuns: 0,
          failedRuns: 0,
          averageDuration: 0,
          lastRun: null,
        },
        runs: [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const refresh = setInterval(loadData, REFRESH_INTERVAL);

    const timer = setInterval(() => {
      setCountdown((v) => (v > 0 ? v - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(refresh);
      clearInterval(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-xl">Scheduler Monitor laden...</div>
    );
  }

  const summary = data?.summary ?? {};
  const runs = data?.runs ?? [];
  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Scheduler Monitor</h1>
          <p className="text-gray-500 mt-1">
            Live overzicht van alle automatische scraper-runs.
          </p>
        </div>

        <div className="text-right text-sm text-gray-500">
          <div>Laatste refresh</div>
          <div className="font-semibold text-black">
            {formatDate(lastRefresh)}
          </div>

          <div className="mt-2">
            Volgende refresh over{" "}
            <span className="font-bold">{countdown}s</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5 mb-8">
        <div className="rounded-xl border bg-white shadow-md hover:shadow-lg transitionp-5">
          <div className="text-sm text-gray-500">Runs vandaag (24u)</div>
          <div className="text-3xl font-bold mt-2">
            {summary.totalRuns ?? 0}
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-md hover:shadow-lg transition p-5">
          <div className="text-sm text-gray-500">Success</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {summary.successRuns ?? 0}
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-md hover:shadow-lg transition p-5">
          <div className="text-sm text-gray-500">Failed</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {summary.failedRuns ?? 0}
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-md hover:shadow-lg transition p-5">
          <div className="text-sm text-gray-500">Gem. duur</div>
          <div className="text-3xl font-bold mt-2">
            {summary.averageDuration ?? 0} ms
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-md hover:shadow-lg transitionp-5">
          <div className="text-sm text-gray-500">Laatste scraper</div>
          <div className="text-lg font-bold mt-2">
            {summary.lastRun?.scraper ?? "-"}
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-md hover:shadow-lg transition p-5">
          <div className="text-sm text-gray-500">Laatste run</div>
          <div className="text-sm font-semibold mt-2">
            {formatDate(summary.lastRun?.started_at)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-md hover:shadow-lg transition overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Laatste Scheduler Runs</h2>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="p-3 text-left">Start</th>

              <th className="p-3 text-left">Einde</th>

              <th className="p-3 text-left">Scraper</th>

              <th className="p-3 text-center">Status</th>

              <th className="p-3 text-right">Stations</th>

              <th className="p-3 text-right">Inserted</th>

              <th className="p-3 text-right">Updated</th>

              <th className="p-3 text-right">Skipped</th>

              <th className="p-3 text-right">Duplicates</th>

              <th className="p-3 text-right">Errors</th>

              <th className="p-3 text-right">Duration</th>
            </tr>
          </thead>

          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-12 text-center text-slate-500">
                  <div className="text-lg font-semibold mb-2">
                    Nog geen scheduler-runs uitgevoerd
                  </div>

                  <div>
                    Zodra de Scheduler een scraper uitvoert verschijnt hier
                    automatisch de historiek.
                  </div>
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr
                  key={run.id}
                  className="border-b hover:bg-slate-50 transition"
                >
                  <td className="p-3 whitespace-nowrap">
                    {formatDate(run.started_at)}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {formatDate(run.finished_at)}
                  </td>

                  <td className="p-3 font-medium">{run.scraper}</td>

                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 min-w-[90px] rounded-full text-xs font-bold ${badgeClass(run.status)}`}
                    >
                      {run.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">{run.stations}</td>

                  <td className="p-3 text-right">{run.inserted}</td>

                  <td className="p-3 text-right">{run.updated}</td>

                  <td className="p-3 text-right">{run.skipped}</td>

                  <td className="p-3 text-right">{run.duplicates}</td>

                  <td className="p-3 text-right">
                    <span
                      className={
                        run.errors > 0
                          ? "font-bold text-red-600"
                          : "text-green-600"
                      }
                    >
                      {run.errors}
                    </span>
                  </td>

                  <td className="p-3 text-right whitespace-nowrap">
                    {run.duration_ms} ms
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
