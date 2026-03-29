require 'rails_helper'

RSpec.describe 'Api::V1::WorkoutSessions', type: :request do
  describe 'GET /api/v1/workout_sessions' do
    it 'returns paginated sessions' do
      3.times { create(:workout_session) }

      get '/api/v1/workout_sessions'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].length).to eq(3)
    end
  end

  describe 'GET /api/v1/workout_sessions/summary' do
    it 'returns aggregated stats' do
      create(:workout_session, status: :completed)
      create(:workout_session, status: :completed)

      get '/api/v1/workout_sessions/summary'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['total_sessions']).to eq(2)
    end
  end

  describe 'GET /api/v1/workout_sessions/:id' do
    it 'returns session with exercises and logs' do
      session = create(:workout_session)
      exercise = create(:exercise)
      se = create(:session_exercise, workout_session: session, exercise: exercise)
      create(:session_exercise_log, session_exercise: se, values: { 'reps' => 10 })

      get "/api/v1/workout_sessions/#{session.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['status']).to eq('in_progress')
    end
  end

  describe 'POST /api/v1/workout_sessions' do
    it 'starts a new session' do
      expect {
        post '/api/v1/workout_sessions', params: { workout_session: { name: 'Push Day', started_at: Time.current.iso8601 } }
      }.to change(WorkoutSession, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe 'PATCH /api/v1/workout_sessions/:id' do
    it 'completes a session' do
      session = create(:workout_session)

      patch "/api/v1/workout_sessions/#{session.id}", params: { workout_session: { status: 'completed', ended_at: Time.current.iso8601 } }

      expect(response).to have_http_status(:ok)
      expect(session.reload.status).to eq('completed')
    end

    it 'abandons a session' do
      session = create(:workout_session)

      patch "/api/v1/workout_sessions/#{session.id}", params: { workout_session: { status: 'abandoned' } }

      expect(response).to have_http_status(:ok)
      expect(session.reload.status).to eq('abandoned')
    end
  end

  describe 'DELETE /api/v1/workout_sessions/:id' do
    it 'deletes a session' do
      session = create(:workout_session)

      expect {
        delete "/api/v1/workout_sessions/#{session.id}"
      }.to change(WorkoutSession, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
