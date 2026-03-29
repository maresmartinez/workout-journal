class WorkoutSessionSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :started_at, :ended_at, :status, :created_at, :updated_at

  has_many :session_exercises, serializer: SessionExerciseSerializer
end
