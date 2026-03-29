require 'rails_helper'

RSpec.describe Exercise, type: :model do
  it 'has a valid factory' do
    exercise = Exercise.new(name: 'Bench Press', exercise_type: 'built_in')
    expect(exercise).to be_valid
  end

  it 'is invalid without a name' do
    exercise = Exercise.new(name: nil, exercise_type: 'built_in')
    expect(exercise).not_to be_valid
    expect(exercise.errors[:name]).to include("can't be blank")
  end

  it 'is invalid without an exercise_type' do
    exercise = Exercise.new(name: 'Bench Press', exercise_type: nil)
    expect(exercise).not_to be_valid
    expect(exercise.errors[:exercise_type]).to include("can't be blank")
  end

  it 'is invalid with an unrecognized exercise_type' do
    exercise = Exercise.new(name: 'Bench Press', exercise_type: 'invalid')
    expect(exercise).not_to be_valid
  end

  it 'allows built_in type' do
    exercise = Exercise.new(name: 'Squat', exercise_type: 'built_in')
    expect(exercise).to be_valid
  end

  it 'allows custom type' do
    exercise = Exercise.new(name: 'My Move', exercise_type: 'custom')
    expect(exercise).to be_valid
  end

  it 'has many exercise_metrics' do
    association = Exercise.reflect_on_association(:exercise_metrics)
    expect(association.macro).to eq(:has_many)
  end

  it 'destroys dependent exercise_metrics' do
    exercise = Exercise.create!(name: 'Test', exercise_type: 'built_in')
    exercise.exercise_metrics.create!(name: 'reps', metric_type: 'integer')
    expect { exercise.destroy }.to change(ExerciseMetric, :count).by(-1)
  end
end
