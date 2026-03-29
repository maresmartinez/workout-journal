FactoryBot.define do
  factory :workout_session do
    name { nil }
    started_at { Time.current }
    ended_at { nil }
    status { :in_progress }
  end
end
