require 'rails_helper'

RSpec.describe 'Api::V1::Progress', type: :request do
  describe 'GET /api/v1/progress/exercises/:exercise_id' do
    it 'returns time-series data for an exercise' do
      exercise = create(:exercise, name: 'Bench Press')
      session1 = create(:workout_session, started_at: 2.days.ago, status: :completed)
      se1 = create(:session_exercise, workout_session: session1, exercise: exercise)
      create(:session_exercise_log, session_exercise: se1, values: { 'reps' => 10, 'weight' => 135 })

      session2 = create(:workout_session, started_at: 1.day.ago, status: :completed)
      se2 = create(:session_exercise, workout_session: session2, exercise: exercise)
      create(:session_exercise_log, session_exercise: se2, values: { 'reps' => 10, 'weight' => 145 })

      get "/api/v1/progress/exercises/#{exercise.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['exercise_id']).to eq(exercise.id)
      expect(json['data_points'].length).to eq(2)
    end

    it 'returns 404 for nonexistent exercise' do
      get '/api/v1/progress/exercises/999999'

      expect(response).to have_http_status(:not_found)
    end
  end
end
