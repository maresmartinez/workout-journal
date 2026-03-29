class SessionExerciseLogSerializer
  include JSONAPI::Serializer

  attributes :id, :values, :notes, :created_at, :updated_at
end
