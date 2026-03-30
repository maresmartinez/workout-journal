class WorkoutTemplateExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :exercise_id, :position, :notes

  belongs_to :exercise, serializer: ExerciseSerializer
end
