require 'rails_helper'

RSpec.describe 'Api::V1::Exercises', type: :request do
  describe 'GET /api/v1/exercises' do
    it 'returns all exercises' do
      create(:exercise, name: 'Bench Press', exercise_type: :built_in)
      create(:exercise, name: 'My Move', exercise_type: :custom)

      get '/api/v1/exercises'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].length).to eq(2)
    end
  end

  describe 'GET /api/v1/exercises/:id' do
    it 'returns exercise with metrics' do
      exercise = create(:exercise, name: 'Bench Press')
      create(:exercise_metric, exercise: exercise, name: 'reps', metric_type: :integer)
      create(:exercise_metric, exercise: exercise, name: 'weight', metric_type: :decimal, unit: 'lbs')

      get "/api/v1/exercises/#{exercise.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['name']).to eq('Bench Press')
      expect(json['included'].length).to eq(2)
    end

    it 'returns 404 for missing exercise' do
      get '/api/v1/exercises/999999'

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/exercises' do
    it 'creates a custom exercise with metrics' do
      params = {
        exercise: {
          name: 'My Exercise',
          exercise_type: 'custom',
          description: 'A cool move',
          exercise_metrics_attributes: [
            { name: 'reps', metric_type: 'integer' },
            { name: 'weight', metric_type: 'decimal', unit: 'lbs' }
          ]
        }
      }

      expect {
        post '/api/v1/exercises', params: params
      }.to change(Exercise, :count).by(1).and change(ExerciseMetric, :count).by(2)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['name']).to eq('My Exercise')
    end

    it 'returns errors for invalid params' do
      post '/api/v1/exercises', params: { exercise: { name: '' } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PUT /api/v1/exercises/:id' do
    it 'updates a custom exercise' do
      exercise = create(:exercise, name: 'Old Name', exercise_type: :custom)

      put "/api/v1/exercises/#{exercise.id}", params: { exercise: { name: 'New Name' } }

      expect(response).to have_http_status(:ok)
      expect(exercise.reload.name).to eq('New Name')
    end

    it 'does not update built_in exercises' do
      exercise = create(:exercise, name: 'Bench Press', exercise_type: :built_in)

      put "/api/v1/exercises/#{exercise.id}", params: { exercise: { name: 'Hacked' } }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'DELETE /api/v1/exercises/:id' do
    it 'deletes a custom exercise' do
      exercise = create(:exercise, exercise_type: :custom)

      expect {
        delete "/api/v1/exercises/#{exercise.id}"
      }.to change(Exercise, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it 'does not delete built_in exercises' do
      exercise = create(:exercise, exercise_type: :built_in)

      delete "/api/v1/exercises/#{exercise.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
