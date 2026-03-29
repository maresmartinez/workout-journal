require 'rails_helper'

RSpec.describe 'Api::V1::SessionExerciseLogs', type: :request do
  let(:session) { create(:workout_session) }
  let(:exercise) { create(:exercise) }
  let(:session_exercise) { create(:session_exercise, workout_session: session, exercise: exercise) }

  describe 'POST /api/v1/workout_sessions/:session_id/session_exercises/:session_exercise_id/logs' do
    it 'creates a log entry' do
      params = { session_exercise_log: { values: { 'reps' => 10, 'weight' => 135 } } }

      expect {
        post "/api/v1/workout_sessions/#{session.id}/session_exercises/#{session_exercise.id}/logs", params: params, as: :json
      }.to change(SessionExerciseLog, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['values']['reps']).to eq(10)
    end
  end

  describe 'PUT /api/v1/workout_sessions/:session_id/session_exercises/:session_exercise_id/logs/:id' do
    it 'updates a log entry' do
      log = create(:session_exercise_log, session_exercise: session_exercise, values: { 'reps' => 10 })

      put "/api/v1/workout_sessions/#{session.id}/session_exercises/#{session_exercise.id}/logs/#{log.id}", params: { session_exercise_log: { values: { 'reps' => 12 } } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(log.reload.values['reps']).to eq(12)
    end
  end

  describe 'DELETE /api/v1/workout_sessions/:session_id/session_exercises/:session_exercise_id/logs/:id' do
    it 'deletes a log entry' do
      log = create(:session_exercise_log, session_exercise: session_exercise)

      expect {
        delete "/api/v1/workout_sessions/#{session.id}/session_exercises/#{session_exercise.id}/logs/#{log.id}"
      }.to change(SessionExerciseLog, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
