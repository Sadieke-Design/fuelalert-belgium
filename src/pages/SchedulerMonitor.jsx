import { useEffect, useState } from "react";

export default function SchedulerMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const res = await fetch("/api/scheduler-monitor");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      setData(json);
    } catch (err) {
      console.error("Scheduler monitor:", err);

      setData({
        success: false,
        summary: {
          totalRuns: 0,
          successRuns: 0,
          failedRuns: 0,
          averageDuration: 0,
        },
        runs: [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const timer = setInterval(loadData, 30000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="p-6 text-lg">Scheduler Monitor laden...</div>;
  }

  const summary = data?.summary ?? {
    totalRuns: 0,
    successRuns: 0,
    failedRuns: 0,
    averageDuration: 0,
  };

  const runs = data?.runs ?? [];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Scheduler Monitor</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500">Runs</div>

          <div className="text-3xl font-bold">{summary.totalRuns}</div>
        </div>

        <div className="rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500">Success</div>

          <div className="text-3xl font-bold text-green-600">
            {summary.successRuns ?? 0}
          </div>
        </div>

        <div className="rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500">Failed</div>

          <div className="text-3xl font-bold text-red-600">
            {summary.failedRuns ?? 0}
          </div>
        </div>

        <div className="rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500">Gemiddelde duur</div>

          <div className="text-3xl font-bold">
            {summary.averageDuration ?? 0} ms
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Start</th>
              <th className="text-left p-3">Scraper</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Stations</th>
              <th className="text-right p-3">Inserted</th>
              <th className="text-right p-3">Updated</th>
              <th className="text-right p-3">Errors</th>
              <th className="text-right p-3">Duration</th>
            </tr>
          </thead>

          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-500">
                  Er zijn nog geen Scheduler Runs geregistreerd.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="border-t">
                  <td className="p-3">{run.started_at}</td>

                  <td className="p-3">{run.scraper}</td>

                  <td className="p-3">
                    <span
                      className={
                        run.status === "SUCCESS"
                          ? "font-bold text-green-600"
                          : "font-bold text-red-600"
                      }
                    >
                      {run.status}
                    </span>
                  </td>

                  <td className="text-right p-3">{run.stations}</td>

                  <td className="text-right p-3">{run.inserted}</td>

                  <td className="text-right p-3">{run.updated}</td>

                  <td className="text-right p-3">{run.errors}</td>

                  <td className="text-right p-3">{run.duration_ms} ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
