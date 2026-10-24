
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import {
  Wind,
  Activity,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatNumber(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("en-GB", {
    maximumFractionDigits: 1,
  });
}

function formatBias(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `${Number(value) > 0 ? "+" : ""}${formatNumber(value)} MW`;
}

function getDailyMetrics(observations) {
  const matched = observations.filter(
    (row) =>
      row.forecastGeneration != null &&
      row.actualGeneration != null &&
      Number.isFinite(Number(row.forecastGeneration)) &&
      Number.isFinite(Number(row.actualGeneration))
  );

  const actualPeriods = observations.filter(
    (row) => row.actualGeneration != null
  ).length;
  const forecastPeriods = observations.filter(
    (row) => row.forecastGeneration != null
  ).length;

  if (!matched.length) {
    return {
      actualPeriods,
      forecastPeriods,
      matchedPeriods: 0,
      mae: null,
      mbe: null,
    };
  }

  const errors = matched.map(
    (row) => Number(row.forecastGeneration) - Number(row.actualGeneration)
  );

  return {
    actualPeriods,
    forecastPeriods,
    matchedPeriods: matched.length,
    mae: errors.reduce((sum, value) => sum + Math.abs(value), 0) / errors.length,
    mbe: errors.reduce((sum, value) => sum + value, 0) / errors.length,
  };
}

function App() {
  const [activeView, setActiveView] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [observations, setObservations] = useState([]);
  const [selectedDate, setSelectedDate] = useState("2026-01-01");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [analyticsResponse, observationsResponse] = await Promise.all([
        fetch(`${API}/api/analytics`),
        fetch(`${API}/api/observations?date=${selectedDate}`),
      ]);

      if (!analyticsResponse.ok) {
        throw new Error(`Analytics request failed (${analyticsResponse.status}).`);
      }

      if (!observationsResponse.ok) {
        throw new Error(`Observations request failed (${observationsResponse.status}).`);
      }

      const [analyticsData, observationsData] = await Promise.all([
        analyticsResponse.json(),
        observationsResponse.json(),
      ]);

      setAnalytics(analyticsData);
      setObservations(observationsData.observations || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load WindCast data. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const monthlyMetrics = analytics?.metrics;

  const dailyMetrics = useMemo(
    () => getDailyMetrics(observations),
    [observations]
  );

  const chartData = useMemo(
    () =>
      observations.map((item) => ({
        time: new Date(item.startTime).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }),
        forecast: item.forecastGeneration,
        actual: item.actualGeneration,
        error: item.error,
      })),
    [observations]
  );

  const metricCards = [
    {
      label: "Mean absolute error",
      value: monthlyMetrics ? `${formatNumber(monthlyMetrics.mae)} MW` : "—",
      description: "Average absolute forecast error · January",
      icon: Activity,
    },
    {
      label: "Mean forecast bias",
      value: monthlyMetrics ? formatBias(monthlyMetrics.mbe) : "—",
      description: "Positive means overforecasting",
      icon: TrendingUp,
    },
    {
      label: "Matched periods",
      value: monthlyMetrics
        ? `${formatNumber(monthlyMetrics.matchedPeriods)} / ${formatNumber(monthlyMetrics.actualPeriods)}`
        : "—",
      description: "Hourly forecast and actual pairs · January",
      icon: Wind,
    },
    {
      label: "Delivery date",
      value: selectedDate,
      description: `${observations.length} hourly records returned`,
      icon: CalendarDays,
    },
  ];

  const dailyMetricCards = [
    {
      label: "Daily MAE",
      value: dailyMetrics.mae == null
        ? "—"
        : `${formatNumber(dailyMetrics.mae)} MW`,
      description: "Average absolute error for this date",
      icon: Activity,
    },
    {
      label: "Daily forecast bias",
      value: dailyMetrics.mbe == null
        ? "—"
        : formatBias(dailyMetrics.mbe),
      description: "Positive means overforecasting",
      icon: TrendingUp,
    },
    {
      label: "Daily matched periods",
      value: `${dailyMetrics.matchedPeriods} / 24`,
      description: "Hourly pairs available for this date",
      icon: CheckCircle2,
    },
    {
      label: "Selected date",
      value: selectedDate,
      description: "Delivery date · UTC",
      icon: CalendarDays,
    },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Wind size={25} /></div>
          <div>
            <h1>WindCast</h1>
            <p>ENERGY INTELLIGENCE</p>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <button
            type="button"
            className={`nav-item ${activeView === "overview" ? "active" : ""}`}
            onClick={() => setActiveView("overview")}
            aria-current={activeView === "overview" ? "page" : undefined}
          >
            <Activity size={18} />
            <span>Forecast overview</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeView === "accuracy" ? "active" : ""}`}
            onClick={() => setActiveView("accuracy")}
            aria-current={activeView === "accuracy" ? "page" : undefined}
          >
            <TrendingUp size={18} />
            <span>Accuracy analytics</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <strong>Elexon BMRS</strong>
            <p>Connected through backend</p>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">UK POWER MARKET / WIND GENERATION</p>
            <h2>
              {activeView === "overview"
                ? "Forecast intelligence"
                : "Accuracy analytics"}
            </h2>
          </div>

          <button
            className="refresh-button"
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={loadAnalytics}>Retry</button>
          </div>
        )}

        {activeView === "overview" ? (
          <>
            <section className="intro">
              <div>
                <span className="period-tag">HISTORICAL ANALYSIS</span>
                <h3>January 2026 overview</h3>
                <p>
                  Explore national wind forecasts, actual generation and
                  forecast error to support day-ahead procurement decisions.
                </p>
              </div>
              <div className="wind-decoration"><Wind size={66} /></div>
            </section>

            <div className="section-heading">
              <div>
                <h3>Performance indicators</h3>
                <p>Monthly forecast evaluation · January 2026</p>
              </div>
              {loading && <span className="loading-label">Loading data…</span>}
            </div>

            <section className="metric-grid">
              {metricCards.map(({ label, value, description, icon: Icon }) => (
                <article className="metric-card" key={label}>
                  <div className="metric-top">
                    <span>{label}</span>
                    <div className="metric-icon"><Icon size={19} /></div>
                  </div>
                  <strong className="metric-value">{value}</strong>
                  <p>{description}</p>
                </article>
              ))}
            </section>

            <section className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Forecast vs actual generation</h3>
                  <p>Hourly wind generation · MW · UTC</p>
                </div>
                <DateFilter
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </div>

              <div className="chart-container">
                {loading && observations.length === 0 ? (
                  <div className="empty-state">Loading observations…</div>
                ) : chartData.length === 0 ? (
                  <div className="empty-state">No observations available for this date.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 12, right: 18, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={3} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        name="Forecast"
                        stroke="#4361ee"
                        strokeWidth={2.5}
                        dot={false}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual"
                        stroke="#0d9b77"
                        strokeWidth={2.5}
                        dot={false}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Forecast error throughout the day</h3>
                  <p>Forecast minus actual · Positive values indicate overforecasting</p>
                </div>
              </div>
              <ErrorChart chartData={chartData} />
            </section>

            <HourlyTable observations={observations} loading={loading} />
          </>
        ) : (
          <>
            <section className="intro accuracy-intro">
              <div>
                <span className="period-tag">MODEL PERFORMANCE</span>
                <h3>Forecast accuracy analysis</h3>
                <p>
                  Compare monthly performance with the selected delivery day.
                  Positive bias means forecasts exceed actual generation.
                </p>
              </div>
              <div className="wind-decoration"><BarChart3 size={66} /></div>
            </section>

            <div className="section-heading">
              <div>
                <h3>January monthly indicators</h3>
                <p>Evaluation across all matched hourly periods</p>
              </div>
              {loading && <span className="loading-label">Loading data…</span>}
            </div>

            <section className="metric-grid monthly-metric-grid">
              {metricCards.slice(0, 3).map(({ label, value, description, icon: Icon }) => (
                <article className="metric-card" key={label}>
                  <div className="metric-top">
                    <span>{label}</span>
                    <div className="metric-icon"><Icon size={19} /></div>
                  </div>
                  <strong className="metric-value">{value}</strong>
                  <p>{description}</p>
                </article>
              ))}
            </section>

            <div className="section-heading daily-heading">
              <div>
                <h3>Selected-day performance</h3>
                <p>Metrics calculated from the selected date's matched observations</p>
              </div>
              <DateFilter
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </div>

            <section className="metric-grid">
              {dailyMetricCards.map(({ label, value, description, icon: Icon }) => (
                <article className="metric-card" key={label}>
                  <div className="metric-top">
                    <span>{label}</span>
                    <div className="metric-icon"><Icon size={19} /></div>
                  </div>
                  <strong className="metric-value">{value}</strong>
                  <p>{description}</p>
                </article>
              ))}
            </section>

            <section className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Daily forecast error</h3>
                  <p>{selectedDate} · Forecast minus actual · MW · UTC</p>
                </div>
              </div>
              <ErrorChart chartData={chartData} />
            </section>

            <HourlyTable observations={observations} loading={loading} />

            <button
              type="button"
              className="back-button"
              onClick={() => setActiveView("overview")}
            >
              <ArrowLeft size={16} />
              Back to forecast overview
            </button>
          </>
        )}

        <footer className="app-footer">
          <span>WindCast · Elexon BMRS data</span>
          <span>Decision cutoff assumption: 12:00 UTC on previous day</span>
          <span>
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString("en-GB")}`
              : "Waiting for data"}
          </span>
        </footer>
      </section>
    </main>
  );
}

function DateFilter({ selectedDate, setSelectedDate }) {
  return (
    <label className="date-filter">
      <span>Delivery date</span>
      <input
        type="date"
        min="2026-01-01"
        max="2026-01-31"
        value={selectedDate}
        onChange={(event) => setSelectedDate(event.target.value)}
      />
    </label>
  );
}

function ErrorChart({ chartData }) {
  if (chartData.length === 0) {
    return <div className="chart-container empty-state">No error data available for this date.</div>;
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={3} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <ReferenceLine y={0} stroke="#8b95a7" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="error"
            name="Forecast error (MW)"
            stroke="#d97706"
            fill="#fbbf24"
            fillOpacity={0.18}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function HourlyTable({ observations, loading }) {
  return (
    <section className="table-card">
      <div className="chart-header">
        <div>
          <h3>Hourly generation records</h3>
          <p>Selected delivery date · all timestamps displayed in UTC</p>
        </div>
        {loading && <span className="loading-label">Updating…</span>}
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Delivery time</th>
              <th>Published (UTC)</th>
              <th>Forecast (MW)</th>
              <th>Actual (MW)</th>
              <th>Error (MW)</th>
            </tr>
          </thead>
          <tbody>
            {observations.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  {loading ? "Loading records…" : "No records available for this date."}
                </td>
              </tr>
            ) : (
              observations.map((row) => (
                <tr key={row.startTime}>
                  <td>
                    {new Date(row.startTime).toLocaleString("en-GB", {
                      timeZone: "UTC",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    {row.publishTime
                      ? new Date(row.publishTime).toLocaleString("en-GB", {
                          timeZone: "UTC",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td>{formatNumber(row.forecastGeneration)}</td>
                  <td>{formatNumber(row.actualGeneration)}</td>
                  <td
                    className={
                      row.error > 0
                        ? "positive-error"
                        : row.error < 0
                          ? "negative-error"
                          : ""
                    }
                  >
                    {formatNumber(row.error)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default App;
