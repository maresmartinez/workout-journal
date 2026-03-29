FactoryBot.define do
  factory :exercise do
    sequence(:name) { |n| "Exercise #{n}" }
    exercise_type { :built_in }
    description { nil }
  end
end
