class SessionExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :position, :notes

  belongs_to :exercise, serializer: ExerciseSerializer
  has_many :session_exercise_logs, serializer: SessionExerciseLogSerializer
end
