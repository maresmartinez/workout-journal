require 'rails_helper'

RSpec.describe WorkoutSession, type: :model do
  it 'is valid with started_at' do
    session = WorkoutSession.new(started_at: Time.current, status: 'in_progress')
    expect(session).to be_valid
  end

  it 'is invalid without started_at' do
    session = WorkoutSession.new(started_at: nil, status: 'in_progress')
    expect(session).not_to be_valid
  end

  it 'defaults status to in_progress' do
    session = WorkoutSession.new(started_at: Time.current)
    expect(session.status).to eq('in_progress')
  end

  it 'allows in_progress status' do
    session = WorkoutSession.new(started_at: Time.current, status: 'in_progress')
    expect(session).to be_valid
  end

  it 'allows completed status' do
    session = WorkoutSession.new(started_at: Time.current, status: 'completed')
    expect(session).to be_valid
  end

  it 'allows abandoned status' do
    session = WorkoutSession.new(started_at: Time.current, status: 'abandoned')
    expect(session).to be_valid
  end

  it 'has many session_exercises' do
    association = WorkoutSession.reflect_on_association(:session_exercises)
    expect(association.macro).to eq(:has_many)
  end

  it 'destroys dependent session_exercises' do
    session = WorkoutSession.create!(started_at: Time.current)
    exercise = Exercise.create!(name: 'Squat', exercise_type: 'built_in')
    session.session_exercises.create!(exercise: exercise, position: 1)
    expect { session.destroy }.to change(SessionExercise, :count).by(-1)
  end
end
