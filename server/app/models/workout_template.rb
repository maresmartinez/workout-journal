class WorkoutTemplate < ApplicationRecord
  validates :name, presence: true

  has_many :workout_template_exercises, dependent: :destroy
  accepts_nested_attributes_for :workout_template_exercises, allow_destroy: true
end
