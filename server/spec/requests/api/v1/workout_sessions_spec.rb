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

  describe 'POST /api/v1/workout_sessions (batch with nested)' do
    it 'creates a session with exercises and logs in one request' do
      exercise = create(:exercise, name: 'Bench Press')

      expect {
        post '/api/v1/workout_sessions', as: :json, params: {
          workout_session: {
            name: 'Push Day',
            started_at: Time.current.iso8601,
            ended_at: Time.current.iso8601,
            status: 'completed',
            session_exercises_attributes: [
              {
                exercise_id: exercise.id,
                position: 1,
                notes: 'warm up',
                session_exercise_logs_attributes: [
                  { values: { 'sets' => 3, 'reps' => 10, 'weight' => 135.0 } },
                  { values: { 'sets' => 3, 'reps' => 8, 'weight' => 185.0 } }
                ]
              }
            ]
          }
        }
      }.to change(WorkoutSession, :count).by(1).and change(SessionExercise, :count).by(1).and change(SessionExerciseLog, :count).by(2)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['status']).to eq('completed')

      session = WorkoutSession.last
      se = session.session_exercises.first
      expect(se.exercise_id).to eq(exercise.id)
      expect(se.position).to eq(1)
      expect(se.notes).to eq('warm up')
      expect(se.session_exercise_logs.count).to eq(2)
      expect(se.session_exercise_logs.first.values).to eq({ 'sets' => 3, 'reps' => 10, 'weight' => 135.0 })
    end

    it 'creates a session without exercises (blank workout finished)' do
      expect {
        post '/api/v1/workout_sessions', params: {
          workout_session: {
            started_at: Time.current.iso8601,
            ended_at: Time.current.iso8601,
            status: 'completed',
            session_exercises_attributes: []
          }
        }, as: :json
      }.to change(WorkoutSession, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe 'POST /api/v1/workout_sessions/create_from_template' do
    it 'creates a session with exercises from a template' do
      template = create(:workout_template, name: 'Push Day')
      ex1 = create(:exercise, name: 'Bench Press')
      ex2 = create(:exercise, name: 'Overhead Press')
      create(:workout_template_exercise, workout_template: template, exercise: ex1, position: 1, notes: 'warm up')
      create(:workout_template_exercise, workout_template: template, exercise: ex2, position: 2)

      expect {
        post '/api/v1/workout_sessions/create_from_template', params: { workout_template_id: template.id }
      }.to change(WorkoutSession, :count).by(1).and change(SessionExercise, :count).by(2)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['name']).to eq('Push Day')
      expect(json['data']['attributes']['status']).to eq('in_progress')

      session = WorkoutSession.last
      ses = session.session_exercises.order(:position)
      expect(ses.pluck(:exercise_id)).to eq([ ex1.id, ex2.id ])
      expect(ses.first.notes).to eq('warm up')
    end

    it 'returns 404 when template not found' do
      post '/api/v1/workout_sessions/create_from_template', params: { workout_template_id: 999999 }

      expect(response).to have_http_status(:not_found)
    end

    it 'creates session even if template has no exercises' do
      template = create(:workout_template, name: 'Empty')

      expect {
        post '/api/v1/workout_sessions/create_from_template', params: { workout_template_id: template.id }
      }.to change(WorkoutSession, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it 'uses provided name over template name' do
      template = create(:workout_template, name: 'Push Day')

      post '/api/v1/workout_sessions/create_from_template', params: { workout_template_id: template.id, name: 'Custom Name' }

      json = JSON.parse(response.body)
      expect(json['data']['attributes']['name']).to eq('Custom Name')
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
