class WorkoutSession < ApplicationRecord
  enum :status, { in_progress: 0, completed: 1, abandoned: 2 }, validate: true

  validates :started_at, presence: true

  has_many :session_exercises, dependent: :destroy

  accepts_nested_attributes_for :session_exercises
end
