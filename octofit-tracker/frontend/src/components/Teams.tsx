import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type Team = { name: string; mascot?: string; members?: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiResource<TeamsResponse>('/api/teams', getJson<TeamsResponse>);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading ? <p role="status">Loading teams...</p> : error ? (
          <p role="alert">Unable to load teams: {error}</p>
        ) : !data?.teams.length ? (
          <p>No teams yet.</p>
        ) : (
          <ul>
            {data.teams.map((team) => (
              <li key={team.name}>
                <strong>{team.name}</strong>
                {team.mascot ? ` — Mascot: ${team.mascot}` : ''}
                <span> ({team.members?.length ?? 0} members)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
