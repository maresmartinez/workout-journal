FactoryBot.define do
  factory :workout_template_exercise do
    association :workout_template
    association :exercise
    position { 1 }
    notes { nil }
  end
end
