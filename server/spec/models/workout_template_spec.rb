require 'rails_helper'

RSpec.describe WorkoutTemplate, type: :model do
  it 'is valid with a name' do
    template = WorkoutTemplate.new(name: 'Push Day')
    expect(template).to be_valid
  end

  it 'is invalid without a name' do
    template = WorkoutTemplate.new(name: nil)
    expect(template).not_to be_valid
    expect(template.errors[:name]).to include("can't be blank")
  end

  it 'has many workout_template_exercises' do
    association = WorkoutTemplate.reflect_on_association(:workout_template_exercises)
    expect(association.macro).to eq(:has_many)
  end

  it 'destroys dependent workout_template_exercises' do
    template = WorkoutTemplate.create!(name: 'Test')
    exercise = Exercise.create!(name: 'Squat', exercise_type: 'built_in')
    template.workout_template_exercises.create!(exercise: exercise, position: 1)
    expect { template.destroy }.to change(WorkoutTemplateExercise, :count).by(-1)
  end
end
