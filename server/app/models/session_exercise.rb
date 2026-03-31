class SessionExercise < ApplicationRecord
  validates :position, presence: true

  belongs_to :workout_session
  belongs_to :exercise

  has_many :session_exercise_logs, dependent: :destroy

  accepts_nested_attributes_for :session_exercise_logs
end
