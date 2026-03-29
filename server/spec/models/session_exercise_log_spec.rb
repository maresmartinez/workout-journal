require 'rails_helper'

RSpec.describe SessionExerciseLog, type: :model do
  let(:session) { WorkoutSession.create!(started_at: Time.current) }
  let(:exercise) { Exercise.create!(name: 'Bench Press', exercise_type: 'built_in') }
  let(:session_exercise) { SessionExercise.create!(workout_session: session, exercise: exercise, position: 1) }

  it 'is valid with values' do
    log = SessionExerciseLog.new(
      session_exercise: session_exercise,
      values: { 'reps' => 10, 'weight' => 135.0 }
    )
    expect(log).to be_valid
  end

  it 'stores JSONB values correctly' do
    log = SessionExerciseLog.create!(
      session_exercise: session_exercise,
      values: { 'reps' => 10, 'weight' => 135.5, 'notes' => 'felt easy' }
    )
    log.reload
    expect(log.values['reps']).to eq(10)
    expect(log.values['weight']).to eq(135.5)
    expect(log.values['notes']).to eq('felt easy')
  end

  it 'belongs to session_exercise' do
    association = SessionExerciseLog.reflect_on_association(:session_exercise)
    expect(association.macro).to eq(:belongs_to)
  end
end
