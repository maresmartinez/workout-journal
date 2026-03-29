require 'rails_helper'

RSpec.describe 'Api::V1::WorkoutTemplates', type: :request do
  let(:exercise) { create(:exercise) }

  describe 'GET /api/v1/workout_templates' do
    it 'returns all templates' do
      create(:workout_template, name: 'Push Day')
      create(:workout_template, name: 'Leg Day')

      get '/api/v1/workout_templates'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].length).to eq(2)
    end
  end

  describe 'GET /api/v1/workout_templates/:id' do
    it 'returns template with exercises' do
      template = create(:workout_template, name: 'Push Day')
      create(:workout_template_exercise, workout_template: template, exercise: exercise, position: 1)

      get "/api/v1/workout_templates/#{template.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['name']).to eq('Push Day')
      expect(json['included'].length).to be >= 1
    end
  end

  describe 'POST /api/v1/workout_templates' do
    it 'creates a template with exercises' do
      params = {
        workout_template: {
          name: 'Push Day',
          description: 'Chest and triceps',
          workout_template_exercises_attributes: [
            { exercise_id: exercise.id, position: 1 }
          ]
        }
      }

      expect {
        post '/api/v1/workout_templates', params: params
      }.to change(WorkoutTemplate, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe 'PUT /api/v1/workout_templates/:id' do
    it 'updates a template' do
      template = create(:workout_template, name: 'Old')

      put "/api/v1/workout_templates/#{template.id}", params: { workout_template: { name: 'New' } }

      expect(response).to have_http_status(:ok)
      expect(template.reload.name).to eq('New')
    end
  end

  describe 'DELETE /api/v1/workout_templates/:id' do
    it 'deletes a template' do
      template = create(:workout_template)

      expect {
        delete "/api/v1/workout_templates/#{template.id}"
      }.to change(WorkoutTemplate, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
