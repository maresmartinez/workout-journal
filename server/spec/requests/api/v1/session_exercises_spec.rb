require 'rails_helper'

RSpec.describe 'Api::V1::SessionExercises', type: :request do
  let(:session) { create(:workout_session) }
  let(:exercise) { create(:exercise) }

  describe 'POST /api/v1/workout_sessions/:session_id/session_exercises' do
    it 'adds an exercise to a session' do
      params = { session_exercise: { exercise_id: exercise.id, position: 1 } }

      expect {
        post "/api/v1/workout_sessions/#{session.id}/session_exercises", params: params
      }.to change(SessionExercise, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe 'PUT /api/v1/workout_sessions/:session_id/session_exercises/:id' do
    it 'updates position and notes' do
      se = create(:session_exercise, workout_session: session, exercise: exercise, position: 1)

      put "/api/v1/workout_sessions/#{session.id}/session_exercises/#{se.id}", params: { session_exercise: { position: 2, notes: 'superset' } }

      expect(response).to have_http_status(:ok)
      expect(se.reload.position).to eq(2)
      expect(se.reload.notes).to eq('superset')
    end
  end

  describe 'DELETE /api/v1/workout_sessions/:session_id/session_exercises/:id' do
    it 'removes an exercise from a session' do
      se = create(:session_exercise, workout_session: session, exercise: exercise)

      expect {
        delete "/api/v1/workout_sessions/#{session.id}/session_exercises/#{se.id}"
      }.to change(SessionExercise, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
