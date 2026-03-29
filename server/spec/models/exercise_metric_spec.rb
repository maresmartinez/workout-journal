require 'rails_helper'

RSpec.describe ExerciseMetric, type: :model do
  let(:exercise) { Exercise.create!(name: 'Bench Press', exercise_type: 'built_in') }

  it 'is valid with required attributes' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: 'integer')
    expect(metric).to be_valid
  end

  it 'is invalid without a name' do
    metric = exercise.exercise_metrics.new(name: nil, metric_type: 'integer')
    expect(metric).not_to be_valid
  end

  it 'is invalid without a metric_type' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: nil)
    expect(metric).not_to be_valid
  end

  it 'is invalid with unrecognized metric_type' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: 'floaty')
    expect(metric).not_to be_valid
  end

  it 'allows integer metric_type' do
    metric = exercise.exercise_metrics.new(name: 'sets', metric_type: 'integer')
    expect(metric).to be_valid
  end

  it 'allows decimal metric_type' do
    metric = exercise.exercise_metrics.new(name: 'weight', metric_type: 'decimal')
    expect(metric).to be_valid
  end

  it 'allows text metric_type' do
    metric = exercise.exercise_metrics.new(name: 'notes', metric_type: 'text')
    expect(metric).to be_valid
  end

  it 'belongs to exercise' do
    association = ExerciseMetric.reflect_on_association(:exercise)
    expect(association.macro).to eq(:belongs_to)
  end

  it 'unit is optional' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: 'integer', unit: nil)
    expect(metric).to be_valid
  end

  it 'required defaults to false' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: 'integer')
    expect(metric.required).to eq(false)
  end
end
