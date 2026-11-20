import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};
type WorkoutSuggestionsResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const userEmail = encodeURIComponent('mona@example.com');
  const { data, loading, error } = useApiResource<WorkoutSuggestionsResponse>(
    `/api/workouts/suggestions/${userEmail}`,
    getJson<WorkoutSuggestionsResponse>,
  );

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading ? <p role="status">Loading workout suggestions...</p> : error ? (
          <p role="alert">Unable to load workout suggestions: {error}</p>
        ) : !data?.suggestions.length ? (
          <p>No workout suggestions yet.</p>
        ) : (
          <ul>
            {data.suggestions.map((workout, index) => (
              <li key={`${workout.title}-${index}`}>
                <strong>{workout.title}</strong>
                {workout.focus ? ` — ${workout.focus}` : ''}
                {workout.minutes !== undefined ? `, ${workout.minutes} minutes` : ''}
                {workout.difficulty ? ` (${workout.difficulty})` : ''}
                {workout.reason ? <p>{workout.reason}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
