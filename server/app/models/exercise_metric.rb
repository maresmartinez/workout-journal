class ExerciseMetric < ApplicationRecord
  enum :metric_type, { integer: 0, decimal: 1, text: 2 }, validate: true

  validates :name, presence: true
  validates :metric_type, presence: true

  belongs_to :exercise
end
