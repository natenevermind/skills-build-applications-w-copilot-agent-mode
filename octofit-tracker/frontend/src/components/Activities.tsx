import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type Activity = { type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const { data, loading, error } = useApiResource<ActivitiesResponse>(
    '/api/activities',
    getJson<ActivitiesResponse>,
  );

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {loading ? <p role="status">Loading activities...</p> : error ? (
          <p role="alert">Unable to load activities: {error}</p>
        ) : !data?.activities.length ? (
          <p>No activities yet.</p>
        ) : (
          <ul>
            {data.activities.map((activity, index) => (
              <li key={`${activity.type}-${index}`}>
                <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
