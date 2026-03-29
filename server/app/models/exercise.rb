class Exercise < ApplicationRecord
  enum :exercise_type, { built_in: 0, custom: 1 }, validate: true

  validates :name, presence: true
  validates :exercise_type, presence: true

  has_many :exercise_metrics, dependent: :destroy

  accepts_nested_attributes_for :exercise_metrics, allow_destroy: true
end
