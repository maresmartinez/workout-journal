require 'rails_helper'

RSpec.describe SessionExercise, type: :model do
  let(:session) { WorkoutSession.create!(started_at: Time.current) }
  let(:exercise) { Exercise.create!(name: 'Bench Press', exercise_type: 'built_in') }

  it 'is valid with required attributes' do
    se = SessionExercise.new(
      workout_session: session,
      exercise: exercise,
      position: 1
    )
    expect(se).to be_valid
  end

  it 'is invalid without a position' do
    se = SessionExercise.new(
      workout_session: session,
      exercise: exercise,
      position: nil
    )
    expect(se).not_to be_valid
  end

  it 'has many session_exercise_logs' do
    association = SessionExercise.reflect_on_association(:session_exercise_logs)
    expect(association.macro).to eq(:has_many)
  end

  it 'destroys dependent session_exercise_logs' do
    se = SessionExercise.create!(workout_session: session, exercise: exercise, position: 1)
    se.session_exercise_logs.create!(values: { 'reps' => 10 })
    expect { se.destroy }.to change(SessionExerciseLog, :count).by(-1)
  end
end
