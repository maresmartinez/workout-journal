class WorkoutTemplateExercise < ApplicationRecord
  validates :position, presence: true

  belongs_to :workout_template
  belongs_to :exercise
end
