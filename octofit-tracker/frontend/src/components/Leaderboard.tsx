import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiResource<LeaderboardResponse>(
    '/api/leaderboard',
    getJson<LeaderboardResponse>,
  );

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading ? <p role="status">Loading leaderboard...</p> : error ? (
          <p role="alert">Unable to load leaderboard: {error}</p>
        ) : !data?.leaderboard.length ? (
          <p>No leaderboard rankings yet.</p>
        ) : (
          <ol>
            {data.leaderboard.map((entry) => (
              <li key={entry.rank}>
                <strong>{entry.teamName}</strong>: {entry.totalPoints} points
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
