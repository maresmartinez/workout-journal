class WorkoutTemplate < ApplicationRecord
  validates :name, presence: true

  has_many :workout_template_exercises, dependent: :destroy
end
