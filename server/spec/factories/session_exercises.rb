FactoryBot.define do
  factory :session_exercise do
    association :workout_session
    association :exercise
    position { 1 }
    notes { nil }
  end
end
