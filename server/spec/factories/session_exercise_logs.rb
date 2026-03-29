FactoryBot.define do
  factory :session_exercise_log do
    association :session_exercise
    values { {} }
    notes { nil }
  end
end
