require 'rails_helper'

RSpec.describe WorkoutTemplateExercise, type: :model do
  let(:template) { WorkoutTemplate.create!(name: 'Push Day') }
  let(:exercise) { Exercise.create!(name: 'Bench Press', exercise_type: 'built_in') }

  it 'is valid with required attributes' do
    wte = WorkoutTemplateExercise.new(
      workout_template: template,
      exercise: exercise,
      position: 1
    )
    expect(wte).to be_valid
  end

  it 'is invalid without a position' do
    wte = WorkoutTemplateExercise.new(
      workout_template: template,
      exercise: exercise,
      position: nil
    )
    expect(wte).not_to be_valid
  end

  it 'belongs to workout_template' do
    association = WorkoutTemplateExercise.reflect_on_association(:workout_template)
    expect(association.macro).to eq(:belongs_to)
  end

  it 'belongs to exercise' do
    association = WorkoutTemplateExercise.reflect_on_association(:exercise)
    expect(association.macro).to eq(:belongs_to)
  end
end
