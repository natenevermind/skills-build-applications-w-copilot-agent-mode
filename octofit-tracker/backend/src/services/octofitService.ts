import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (
    !isRecord(input) ||
    typeof input.userId !== 'string' ||
    !Types.ObjectId.isValid(input.userId) ||
    typeof input.teamId !== 'string' ||
    !Types.ObjectId.isValid(input.teamId) ||
    typeof input.type !== 'string' ||
    input.type.trim().length === 0 ||
    typeof input.minutes !== 'number' ||
    !Number.isFinite(input.minutes) ||
    input.minutes <= 0
  ) {
    throw Object.assign(new Error('Activity requires valid userId, teamId, type, and positive minutes'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: input.userId }),
    Team.exists({ _id: input.teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: input.userId,
    team: input.teamId,
    type: input.type.trim(),
    minutes: input.minutes,
    points: input.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (
    !isRecord(input) ||
    typeof input.name !== 'string' ||
    input.name.trim().length === 0 ||
    typeof input.mascot !== 'string' ||
    input.mascot.trim().length === 0
  ) {
    throw Object.assign(new Error('Team requires a name and mascot'), { status: 400 });
  }

  const members = input.members === undefined ? [] : input.members;
  if (!Array.isArray(members) || !members.every((member) => typeof member === 'string' && Types.ObjectId.isValid(member))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const existingMembers = await Promise.all(members.map((member) => User.exists({ _id: member })));
  if (existingMembers.some((member) => !member)) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({
    name: input.name.trim(),
    mascot: input.mascot.trim(),
    members,
  });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string) {
  const normalizedType = type.trim().toLowerCase();
  if (['run', 'cycle', 'cycling', 'swim', 'cardio'].includes(normalizedType)) return 'endurance';
  return normalizedType;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [workouts, activities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
  ]);
  const goalFocus = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.trim().toLowerCase() : '';
  const preferredFocuses = [...new Set([
    ...(goalFocus ? [goalFocus] : []),
    ...activities.map((activity) => focusForActivity(activity.type)),
  ])];
  const orderedWorkouts = [
    ...preferredFocuses.flatMap((focus) => workouts.filter((workout) => workout.focus.toLowerCase() === focus)),
    ...workouts,
  ];
  const seen = new Set<string>();

  return orderedWorkouts.flatMap((workout) => {
    const id = workout._id.toString();
    if (seen.has(id)) return [];
    seen.add(id);

    const focus = workout.focus.toLowerCase();
    const activity = activities.find((recentActivity) => focusForActivity(recentActivity.type) === focus);
    const reason = focus === goalFocus
      ? `Recommended for your ${user.fitnessGoal} goal.`
      : activity
        ? `Recommended based on your recent ${activity.type} activity.`
        : 'Suggested as a general workout.';
    return [{ ...workout, reason }];
  });
}

export { User };
