class ExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :description, :exercise_type, :created_at, :updated_at

  has_many :exercise_metrics, serializer: ExerciseMetricSerializer
end
