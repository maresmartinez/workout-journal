class WorkoutTemplateSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :description, :created_at, :updated_at

  has_many :workout_template_exercises, serializer: WorkoutTemplateExerciseSerializer
end
