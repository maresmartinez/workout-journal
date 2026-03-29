FactoryBot.define do
  factory :exercise_metric do
    association :exercise
    sequence(:name) { |n| "metric_#{n}" }
    metric_type { :integer }
    unit { nil }
    required { false }
  end
end
