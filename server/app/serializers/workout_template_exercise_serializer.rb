class WorkoutTemplateExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :position, :notes

  belongs_to :exercise, serializer: ExerciseSerializer
end
