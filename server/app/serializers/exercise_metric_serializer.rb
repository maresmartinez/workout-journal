class ExerciseMetricSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :metric_type, :unit, :required
end
