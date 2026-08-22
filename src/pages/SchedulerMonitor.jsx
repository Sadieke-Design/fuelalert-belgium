import { useEffect, useState } from "react";

const REFRESH_INTERVAL = 30000;

const SCRAPERS = ["SHELL", "DATS24", "MAES_NETWORK"];

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusClass = (status) => {
  if (status === "SUCCESS") {
    return "bg-green-500/10 text-green-400 border border-green-500/30";
  }

  return "bg-red-500/10 text-red-400 border border-red-500/30";
};

const scraperLabel = (scraper) => {
  if (scraper === "MAES_NETWORK") {
    return "MAES NETWORK";
  }

  return scraper;
};

export default function SchedulerMonitor() {
  const [data, setData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedScraper, setSelectedScraper] = useState("MAES_NETWORK");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  async function loadData(currentPage = page) {
    try {
      setLoading(true);

      /*
       * =========================================
       * FILTERED DATA
       * =========================================
       *
       * Deze request bevat de geselecteerde scraper.
       *
       * Daardoor worden:
       * - summary
       * - pagination
       * - totalRuns
       * - totalPages
       * - runs
       *
       * allemaal gebaseerd op de geselecteerde scraper.
       */

      const filteredUrl =
        `/api/scheduler-monitor?page=${currentPage}` +
        `&scraper=${encodeURIComponent(selectedScraper)}`;

      /*
       * =========================================
       * OVERVIEW DATA
       * =========================================
       *
       * Deze request blijft zonder scraper-filter.
       * Deze data wordt gebruikt voor:
       * "Laatste scraper-runs"
       *
       * zodat daar nog steeds de laatste run van
       * iedere scraper zichtbaar blijft.
       */

      const overviewUrl = `/api/scheduler-monitor?page=1`;

      const [filteredResponse, overviewResponse] = await Promise.all([
        fetch(filteredUrl),
        fetch(overviewUrl),
      ]);

      if (!filteredResponse.ok) {
        throw new Error(`HTTP ${filteredResponse.status}`);
      }

      if (!overviewResponse.ok) {
        throw new Error(`HTTP ${overviewResponse.status}`);
      }

      const [filteredJson, overviewJson] = await Promise.all([
        filteredResponse.json(),
        overviewResponse.json(),
      ]);

      setData(filteredJson);
      setOverviewData(overviewJson);

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

      setOverviewData({
        success: false,

        summary: {
          totalRuns: 0,
          successRuns: 0,
          failedRuns: 0,
          averageDuration: 0,
          lastRun: null,
        },

        pagination: {
          page: 1,
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

    const refreshTimer = setInterval(() => {
      loadData(page);
    }, REFRESH_INTERVAL);

    const countdownTimer = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          return 30;
        }

        return value - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(countdownTimer);
    };
  }, [page, selectedScraper]);

  if (loading && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-lg text-slate-400">Scheduler Monitor laden...</div>
      </div>
    );
  }

  /*
   * =========================================
   * FILTERED SUMMARY
   * =========================================
   *
   * Deze summary hoort bij de geselecteerde
   * scraper.
   */

  const summary = data?.summary ?? {};

  /*
   * =========================================
   * FILTERED HISTORY
   * =========================================
   */

  const runs = data?.runs ?? [];

  /*
   * =========================================
   * PAGINATION
   * =========================================
   *
   * Deze pagination is nu scraper-specifiek.
   */

  const pagination = data?.pagination ?? {
    page: 1,
    limit: 50,
    totalRuns: 0,
    totalPages: 1,
  };

  /*
   * =========================================
   * OVERVIEW / LATEST SCRAPER RUNS
   * =========================================
   *
   * Deze lijst blijft alle scrapers tonen.
   */

  const overviewRuns = overviewData?.runs ?? [];

  const latestRunsByScraper = {};

  for (const run of overviewRuns) {
    if (!latestRunsByScraper[run.scraper]) {
      latestRunsByScraper[run.scraper] = run;
    }
  }

  const latestScraperRuns = Object.values(latestRunsByScraper);

  /*
   * =========================================
   * FILTERED RUNS
   * =========================================
   *
   * De backend levert al gefilterde runs.
   * De extra filter hier zorgt ervoor dat de
   * frontend nooit per ongeluk een andere scraper
   * toont.
   */

  const filteredRuns = runs.filter((run) => run.scraper === selectedScraper);

  /*
   * =========================================
   * PAGINATION
   * =========================================
   */

  const goToPage = (newPage) => {
    if (newPage < 1) return;

    if (newPage > pagination.totalPages) return;

    setPage(newPage);
  };

  /*
   * =========================================
   * SCRAPER SELECTIE
   * =========================================
   */

  const selectScraper = (scraper) => {
    if (scraper === selectedScraper) return;

    setSelectedScraper(scraper);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* =========================================
          HEADER
      ========================================= */}

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

      {/* =========================================
          SUMMARY CARDS
      ========================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="text-sm text-slate-400">
            Runs {scraperLabel(selectedScraper)}
          </div>

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

            <span className="text-lg text-slate-400 ml-1">ms</span>
          </div>
        </div>
      </div>

      {/* =========================================
          LATEST SCRAPER RUNS
      ========================================= */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-8">
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-white">
            Laatste scraper-runs
          </h2>

          <p className="text-slate-400 mt-1">
            Laatste uitvoering per brandstofstation-netwerk.
          </p>
        </div>

        {latestScraperRuns.length === 0 ? (
          <div className="text-slate-400">
            Nog geen scheduler-runs beschikbaar.
          </div>
        ) : (
          <div className="space-y-4">
            {latestScraperRuns.map((run) => (
              <div
                key={run.scraper}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-5"
              >
                <div className="grid grid-cols-2 md:grid-cols-6 gap-5 items-center">
                  <div className="min-w-0">
                    <div className="text-sm text-slate-400">Scraper</div>

                    <div
                      className="text-lg font-bold text-white mt-1 truncate"
                      title={run.scraper}
                    >
                      {scraperLabel(run.scraper)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">Status</div>

                    <span
                      className={`inline-flex mt-1 px-3 py-1 rounded-full text-sm font-bold ${statusClass(
                        run.status,
                      )}`}
                    >
                      {run.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">Stations</div>

                    <div className="text-2xl font-bold text-yellow-400 mt-1">
                      {run.stations ?? 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">Updated</div>

                    <div className="text-2xl font-bold text-green-400 mt-1">
                      {run.updated ?? 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">Errors</div>

                    <div
                      className={`text-2xl font-bold mt-1 ${
                        Number(run.errors) > 0
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {run.errors ?? 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-400">Duur</div>

                    <div className="text-xl font-bold text-white mt-1">
                      {run.duration_ms ?? 0}

                      <span className="text-sm text-slate-400 ml-1">ms</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-500">
                  Laatste uitvoering:{" "}
                  <span className="text-slate-300">
                    {formatDate(run.started_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================
          HISTORY
      ========================================= */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {/* HISTORY HEADER */}

        <div className="px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-white">Historiek</h2>

            <p className="text-slate-400 mt-1">Scheduler-runs per scraper</p>
          </div>

          {/* =========================================
              SCRAPER-SPECIFIEKE RUN TELLER
          ========================================= */}

          <div className="text-slate-400">
            <span className="font-semibold text-white">
              {pagination.totalRuns}
            </span>{" "}
            {scraperLabel(selectedScraper)} runs
          </div>
        </div>

        {/* =========================================
            SCRAPER FILTER
        ========================================= */}

        <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap gap-3">
          {SCRAPERS.map((scraper) => (
            <button
              key={scraper}
              type="button"
              onClick={() => selectScraper(scraper)}
              className={`px-5 py-2.5 rounded-xl border font-semibold transition ${
                selectedScraper === scraper
                  ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              {scraperLabel(scraper)}
            </button>
          ))}
        </div>

        {/* =========================================
            HISTORY TABLE
        ========================================= */}

        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="w-[20%] px-4 py-4 text-left text-slate-400 font-semibold">
                  Start
                </th>

                <th className="w-[28%] px-4 py-4 text-left text-slate-400 font-semibold">
                  Scraper
                </th>

                <th className="w-[12%] px-4 py-4 text-center text-slate-400 font-semibold">
                  Status
                </th>

                <th className="w-[13%] px-4 py-4 text-right text-slate-400 font-semibold">
                  Stations
                </th>

                <th className="w-[13%] px-4 py-4 text-right text-slate-400 font-semibold">
                  Updated
                </th>

                <th className="w-[7%] px-4 py-4 text-right text-slate-400 font-semibold">
                  Fout
                </th>

                <th className="w-[12%] px-4 py-4 text-right text-slate-400 font-semibold">
                  Duur
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRuns.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Nog geen scheduler-runs geregistreerd voor{" "}
                    {scraperLabel(selectedScraper)}.
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-white">
                      {formatDate(run.started_at)}
                    </td>

                    <td
                      className="px-4 py-4 font-semibold text-white truncate"
                      title={run.scraper}
                    >
                      {scraperLabel(run.scraper)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {run.status === "SUCCESS" ? (
                        <span
                          title="SUCCESS"
                          aria-label="SUCCESS"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-bold"
                        >
                          ✓
                        </span>
                      ) : (
                        <span
                          title="FAILED"
                          aria-label="FAILED"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold"
                        >
                          ✕
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-white">
                      {run.stations ?? 0}
                    </td>

                    <td className="px-4 py-4 text-right text-green-400 font-semibold">
                      {run.updated ?? 0}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span
                        className={
                          Number(run.errors) > 0
                            ? "text-red-400 font-bold"
                            : "text-slate-400"
                        }
                      >
                        {run.errors ?? 0}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right whitespace-nowrap text-white">
                      {run.duration_ms ?? 0}

                      <span className="text-slate-500 ml-1">ms</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================
            PAGINATION
        ========================================= */}

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

      {/* =========================================
          FOOTER
      ========================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 px-1">
        <div className="text-sm text-slate-500">
          FuelAlert Belgium • Scheduler Monitor
        </div>

        <div className="text-sm text-slate-500">
          Automatische refresh: 30 sec
        </div>
      </div>
    </div>
  );
}
