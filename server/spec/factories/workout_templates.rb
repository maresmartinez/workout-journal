FactoryBot.define do
  factory :workout_template do
    sequence(:name) { |n| "Template #{n}" }
    description { nil }
  end
end
