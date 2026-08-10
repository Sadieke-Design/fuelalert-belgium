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
    ? "bg-green-500/10 text-green-400 border border-green-500/30"
    : "bg-red-500/10 text-red-400 border border-red-500/30";

export default function SchedulerMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  async function loadData(currentPage = page) {
    try {
      const res = await fetch(`/api/scheduler-monitor?page=${currentPage}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      setData(json);
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (err) {
      console.error("Scheduler Monitor:", err);

      setData({
        success: false,
        summary: {
          totalRuns: 0,
          successRuns: 0,
          failedRuns: 0,
          averageDuration: 0,
          lastRun: null,
        },
        pagination: {
          page: currentPage,
          limit: 50,
          totalRuns: 0,
          totalPages: 1,
        },
        runs: [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(page);

    const refresh = setInterval(() => {
      loadData(page);
    }, REFRESH_INTERVAL);

    const timer = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          return 30;
        }

        return value - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refresh);
      clearInterval(timer);
    };
  }, [page]);

  function goToPage(newPage) {
    if (!data?.pagination) return;

    if (newPage < 1 || newPage > data.pagination.totalPages) {
      return;
    }

    setLoading(true);
    setPage(newPage);
  }

  if (loading && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-slate-400 text-lg">Scheduler Monitor laden...</div>
      </div>
    );
  }

  const summary = data?.summary ?? {};

  const runs = data?.runs ?? [];

  const pagination = data?.pagination ?? {
    page: 1,
    limit: 50,
    totalRuns: 0,
    totalPages: 1,
  };

  const latestRun = summary.lastRun;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Scheduler Monitor</h1>

          <p className="text-slate-400 mt-2">
            Live monitoring van alle FuelAlert scrapers.
          </p>
        </div>

        <div className="text-left lg:text-right">
          <div className="text-sm text-slate-400">Laatste refresh</div>

          <div className="font-semibold text-white">
            {formatDate(lastRefresh)}
          </div>

          <div className="text-sm text-slate-400 mt-2">
            Volgende refresh over{" "}
            <span className="font-bold text-yellow-400">{countdown}s</span>
          </div>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="text-sm text-slate-400">Runs vandaag</div>

          <div className="text-4xl font-bold text-white mt-2">
            {summary.totalRuns ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="text-sm text-slate-400">Success</div>

          <div className="text-4xl font-bold text-green-400 mt-2">
            {summary.successRuns ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="text-sm text-slate-400">Failed</div>

          <div className="text-4xl font-bold text-red-400 mt-2">
            {summary.failedRuns ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="text-sm text-slate-400">Gemiddelde duur</div>

          <div className="text-4xl font-bold text-white mt-2">
            {summary.averageDuration ?? 0}
            <span className="text-xl text-slate-400 ml-1">ms</span>
          </div>
        </div>
      </div>

      {/* LATEST RUN */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <h2 className="text-2xl font-bold text-white">
            Laatste uitgevoerde run
          </h2>

          <span
            className={`inline-flex w-fit px-4 py-2 rounded-full text-sm font-bold ${badgeClass(
              latestRun?.status,
            )}`}
          >
            {latestRun?.status ?? "-"}
          </span>
        </div>

        {latestRun ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <div className="text-sm text-slate-400">Scraper</div>

              <div className="text-xl font-bold text-white mt-2 truncate">
                {latestRun.scraper ?? "-"}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-400">Stations</div>

              <div className="text-3xl font-bold text-yellow-400 mt-2">
                {latestRun.stations ?? 0}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-400">Updated</div>

              <div className="text-3xl font-bold text-green-400 mt-2">
                {latestRun.updated ?? 0}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-400">Errors</div>

              <div
                className={`text-3xl font-bold mt-2 ${
                  Number(latestRun.errors) > 0
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {latestRun.errors ?? 0}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-400">Duur</div>

              <div className="text-3xl font-bold text-white mt-2">
                {latestRun.duration_ms ?? 0}
                <span className="text-lg text-slate-400 ml-1">ms</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400">
            Nog geen scheduler-run beschikbaar.
          </div>
        )}
      </div>

      {/* HISTORY */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-white">Historiek</h2>

            <p className="text-slate-400 mt-1">Laatste scheduler-runs</p>
          </div>

          <div className="text-slate-400">{pagination.totalRuns} runs</div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold">
                  Start
                </th>

                <th className="px-6 py-4 text-left text-slate-400 font-semibold">
                  Scraper
                </th>

                <th className="px-6 py-4 text-center text-slate-400 font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-slate-400 font-semibold">
                  Stations
                </th>

                <th className="px-6 py-4 text-right text-slate-400 font-semibold">
                  Updated
                </th>

                <th className="px-6 py-4 text-right text-slate-400 font-semibold">
                  Errors
                </th>

                <th className="px-6 py-4 text-right text-slate-400 font-semibold">
                  Duur
                </th>
              </tr>
            </thead>

            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Nog geen scheduler-runs geregistreerd.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {formatDate(run.started_at)}
                    </td>

                    <td className="px-6 py-4 font-semibold text-white">
                      {run.scraper}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${badgeClass(
                          run.status,
                        )}`}
                      >
                        {run.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-white">
                      {run.stations ?? 0}
                    </td>

                    <td className="px-6 py-4 text-right text-green-400 font-semibold">
                      {run.updated ?? 0}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span
                        className={
                          Number(run.errors) > 0
                            ? "text-red-400 font-bold"
                            : "text-green-400"
                        }
                      >
                        {run.errors ?? 0}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap text-white">
                      {run.duration_ms ?? 0} ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="px-6 py-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-400">
            Pagina{" "}
            <span className="font-semibold text-white">{pagination.page}</span>{" "}
            van{" "}
            <span className="font-semibold text-white">
              {pagination.totalPages}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-4 py-2 rounded-lg border border-slate-700 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Vorige
            </button>

            <button
              type="button"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 rounded-lg border border-slate-700 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Volgende →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
