# Phase 2: Rails API Endpoints, Serializers, Request Specs

**Goal:** Implement all API controllers with JSON serialization, nested routes, and full request specs.

**Verification:** `cd server && bundle exec rspec spec/requests/` passes all request specs.

---

## Task 1: Add jsonapi-serializer Gem and CORS Config

**Files:**
- Modify: `server/Gemfile`
- Create: `server/config/initializers/cors.rb`

- [ ] **Step 1: Add gems to Gemfile**

Add to `server/Gemfile`:

```ruby
gem 'jsonapi-serializer'
```

In the `:development, :test` group, add:

```ruby
gem 'factory_bot_rails'
```

```bash
cd server && bundle install
```

- [ ] **Step 2: Add CORS initializer**

Create `server/config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options]
  end
end
```

Add to `server/Gemfile` (outside any group):

```ruby
gem 'rack-cors'
```

```bash
cd server && bundle install
```

- [ ] **Step 3: Configure FactoryBot in rails_helper**

Add to `server/spec/rails_helper.rb` inside the `RSpec.configure` block:

```ruby
config.include FactoryBot::Syntax::Methods
```

- [ ] **Step 4: Create model factories**

Create `server/spec/factories/exercises.rb`:

```ruby
FactoryBot.define do
  factory :exercise do
    sequence(:name) { |n| "Exercise #{n}" }
    exercise_type { :built_in }
    description { nil }
  end
end
```

Create `server/spec/factories/exercise_metrics.rb`:

```ruby
FactoryBot.define do
  factory :exercise_metric do
    association :exercise
    sequence(:name) { |n| "metric_#{n}" }
    metric_type { :integer }
    unit { nil }
    required { false }
  end
end
```

Create `server/spec/factories/workout_templates.rb`:

```ruby
FactoryBot.define do
  factory :workout_template do
    sequence(:name) { |n| "Template #{n}" }
    description { nil }
  end
end
```

Create `server/spec/factories/workout_template_exercises.rb`:

```ruby
FactoryBot.define do
  factory :workout_template_exercise do
    association :workout_template
    association :exercise
    position { 1 }
    notes { nil }
  end
end
```

Create `server/spec/factories/workout_sessions.rb`:

```ruby
FactoryBot.define do
  factory :workout_session do
    name { nil }
    started_at { Time.current }
    ended_at { nil }
    status { :in_progress }
  end
end
```

Create `server/spec/factories/session_exercises.rb`:

```ruby
FactoryBot.define do
  factory :session_exercise do
    association :workout_session
    association :exercise
    position { 1 }
    notes { nil }
  end
end
```

Create `server/spec/factories/session_exercise_logs.rb`:

```ruby
FactoryBot.define do
  factory :session_exercise_log do
    association :session_exercise
    values { {} }
    notes { nil }
  end
end
```

- [ ] **Step 5: Commit**

```bash
git add server/ && git commit -m "chore: add jsonapi-serializer, rack-cors, factory_bot_rails"
```

---

## Task 2: Exercises API

**Files:**
- Create: `server/app/controllers/api/v1/exercises_controller.rb`
- Create: `server/app/serializers/exercise_serializer.rb`
- Create: `server/app/serializers/exercise_metric_serializer.rb`
- Create: `server/spec/requests/api/v1/exercises_spec.rb`

- [ ] **Step 1: Write failing request specs for Exercises**

Create `server/spec/requests/api/v1/exercises_spec.rb`:

```ruby
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
```

- [ ] **Step 2: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/requests/api/v1/exercises_spec.rb
```

Expected: FAIL — uninitialized constant

- [ ] **Step 3: Create serializers**

Create `server/app/serializers/exercise_metric_serializer.rb`:

```ruby
class ExerciseMetricSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :metric_type, :unit, :required
end
```

Create `server/app/serializers/exercise_serializer.rb`:

```ruby
class ExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :description, :exercise_type, :created_at, :updated_at

  has_many :exercise_metrics, serializer: ExerciseMetricSerializer
end
```

- [ ] **Step 4: Create Exercises controller**

Create `server/app/controllers/api/v1/exercises_controller.rb`:

```ruby
class Api::V1::ExercisesController < ApplicationController
  before_action :set_exercise, only: [:show, :update, :destroy]

  def index
    exercises = Exercise.all
    render json: ExerciseSerializer.new(exercises, include: [:exercise_metrics]).serializable_hash.to_json
  end

  def show
    render json: ExerciseSerializer.new(@exercise, include: [:exercise_metrics]).serializable_hash.to_json
  end

  def create
    exercise = Exercise.new(exercise_params)
    exercise.exercise_type = :custom

    if exercise.save
      render json: ExerciseSerializer.new(exercise, include: [:exercise_metrics]).serializable_hash.to_json, status: :created
    else
      render json: { errors: exercise.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @exercise.built_in?
      render json: { error: 'Cannot modify built-in exercises' }, status: :forbidden and return
    end

    if @exercise.update(exercise_params)
      render json: ExerciseSerializer.new(@exercise, include: [:exercise_metrics]).serializable_hash.to_json
    else
      render json: { errors: @exercise.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @exercise.built_in?
      render json: { error: 'Cannot delete built-in exercises' }, status: :forbidden and return
    end

    @exercise.destroy
    head :no_content
  end

  private

  def set_exercise
    @exercise = Exercise.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Exercise not found' }, status: :not_found
  end

  def exercise_params
    params.require(:exercise).permit(:name, :description, exercise_metrics_attributes: [:id, :name, :metric_type, :unit, :required, :_destroy])
  end
end
```

Add `accepts_nested_attributes_for` to `server/app/models/exercise.rb`:

```ruby
accepts_nested_attributes_for :exercise_metrics, allow_destroy: true
```

- [ ] **Step 5: Set up routes**

Edit `server/config/routes.rb`:

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :exercises
      resources :workout_templates
      resources :workout_sessions do
        resources :session_exercises do
          resources :logs, controller: 'session_exercise_logs'
        end
      end
      get '/progress/exercises/:exercise_id', to: 'progress#exercise_history'
      get '/workout_sessions/summary', to: 'workout_sessions#summary', on: :collection
    end
  end
end
```

Note: The `workout_sessions/summary` route needs to come before the `resources :workout_sessions` block. Move it to a separate declaration:

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :exercises
      resources :workout_templates
      get '/workout_sessions/summary', to: 'workout_sessions#summary'
      resources :workout_sessions do
        resources :session_exercises do
          resources :logs, controller: 'session_exercise_logs'
        end
      end
      get '/progress/exercises/:exercise_id', to: 'progress#exercise_history'
    end
  end
end
```

- [ ] **Step 6: Add ApplicationController base**

Ensure `server/app/controllers/application_controller.rb` exists (it should from rails new). It just needs:

```ruby
class ApplicationController < ActionController::API
end
```

- [ ] **Step 7: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/requests/api/v1/exercises_spec.rb
```

Expected: all examples PASS

- [ ] **Step 8: Commit**

```bash
git add server/ && git commit -m "feat: add Exercises API with nested metrics, serializers, request specs"
```

---

## Task 3: Workout Templates API

**Files:**
- Create: `server/app/controllers/api/v1/workout_templates_controller.rb`
- Create: `server/app/serializers/workout_template_serializer.rb`
- Create: `server/app/serializers/workout_template_exercise_serializer.rb`
- Create: `server/spec/requests/api/v1/workout_templates_spec.rb`

- [ ] **Step 1: Write failing request specs for Workout Templates**

Create `server/spec/requests/api/v1/workout_templates_spec.rb`:

```ruby
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
```

- [ ] **Step 2: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/requests/api/v1/workout_templates_spec.rb
```

Expected: FAIL

- [ ] **Step 3: Create serializers**

Create `server/app/serializers/workout_template_exercise_serializer.rb`:

```ruby
class WorkoutTemplateExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :position, :notes

  belongs_to :exercise, serializer: ExerciseSerializer
end
```

Create `server/app/serializers/workout_template_serializer.rb`:

```ruby
class WorkoutTemplateSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :description, :created_at, :updated_at

  has_many :workout_template_exercises, serializer: WorkoutTemplateExerciseSerializer
end
```

- [ ] **Step 4: Create controller**

Create `server/app/controllers/api/v1/workout_templates_controller.rb`:

```ruby
class Api::V1::WorkoutTemplatesController < ApplicationController
  before_action :set_template, only: [:show, :update, :destroy]

  def index
    templates = WorkoutTemplate.all
    render json: WorkoutTemplateSerializer.new(templates, include: [:workout_template_exercises]).serializable_hash.to_json
  end

  def show
    render json: WorkoutTemplateSerializer.new(@template, include: [:workout_template_exercises, :'workout_template_exercises.exercise']).serializable_hash.to_json
  end

  def create
    template = WorkoutTemplate.new(template_params)

    if template.save
      render json: WorkoutTemplateSerializer.new(template, include: [:workout_template_exercises]).serializable_hash.to_json, status: :created
    else
      render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @template.update(template_params)
      render json: WorkoutTemplateSerializer.new(@template, include: [:workout_template_exercises]).serializable_hash.to_json
    else
      render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @template.destroy
    head :no_content
  end

  private

  def set_template
    @template = WorkoutTemplate.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Workout template not found' }, status: :not_found
  end

  def template_params
    params.require(:workout_template).permit(:name, :description, workout_template_exercises_attributes: [:id, :exercise_id, :position, :notes, :_destroy])
  end
end
```

Add `accepts_nested_attributes_for` to `server/app/models/workout_template.rb`:

```ruby
accepts_nested_attributes_for :workout_template_exercises, allow_destroy: true
```

- [ ] **Step 5: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/requests/api/v1/workout_templates_spec.rb
```

Expected: all examples PASS

- [ ] **Step 6: Commit**

```bash
git add server/ && git commit -m "feat: add Workout Templates API with nested exercises, serializers, request specs"
```

---

## Task 4: Workout Sessions API (with nested resources)

**Files:**
- Create: `server/app/controllers/api/v1/workout_sessions_controller.rb`
- Create: `server/app/controllers/api/v1/session_exercises_controller.rb`
- Create: `server/app/controllers/api/v1/session_exercise_logs_controller.rb`
- Create: `server/app/serializers/workout_session_serializer.rb`
- Create: `server/app/serializers/session_exercise_serializer.rb`
- Create: `server/app/serializers/session_exercise_log_serializer.rb`
- Create: `server/spec/requests/api/v1/workout_sessions_spec.rb`
- Create: `server/spec/requests/api/v1/session_exercises_spec.rb`
- Create: `server/spec/requests/api/v1/session_exercise_logs_spec.rb`

- [ ] **Step 1: Write failing request specs for Workout Sessions**

Create `server/spec/requests/api/v1/workout_sessions_spec.rb`:

```ruby
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
```

- [ ] **Step 2: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/requests/api/v1/workout_sessions_spec.rb
```

Expected: FAIL

- [ ] **Step 3: Create serializers**

Create `server/app/serializers/session_exercise_log_serializer.rb`:

```ruby
class SessionExerciseLogSerializer
  include JSONAPI::Serializer

  attributes :id, :values, :notes, :created_at, :updated_at
end
```

Create `server/app/serializers/session_exercise_serializer.rb`:

```ruby
class SessionExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :position, :notes

  belongs_to :exercise, serializer: ExerciseSerializer
  has_many :session_exercise_logs, serializer: SessionExerciseLogSerializer
end
```

Create `server/app/serializers/workout_session_serializer.rb`:

```ruby
class WorkoutSessionSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :started_at, :ended_at, :status, :created_at, :updated_at

  has_many :session_exercises, serializer: SessionExerciseSerializer
end
```

- [ ] **Step 4: Create WorkoutSessions controller**

Create `server/app/controllers/api/v1/workout_sessions_controller.rb`:

```ruby
class Api::V1::WorkoutSessionsController < ApplicationController
  before_action :set_session, only: [:show, :update, :destroy]

  def index
    sessions = WorkoutSession.order(started_at: :desc).limit(50)
    render json: WorkoutSessionSerializer.new(sessions).serializable_hash.to_json
  end

  def summary
    total_sessions = WorkoutSession.count
    completed_sessions = WorkoutSession.where(status: :completed).count
    total_volume = SessionExerciseLog.joins(:session_exercise).sum('1')

    render json: {
      total_sessions: total_sessions,
      completed_sessions: completed_sessions
    }
  end

  def show
    render json: WorkoutSessionSerializer.new(@session, include: [:session_exercises, :'session_exercises.exercise', :'session_exercises.session_exercise_logs']).serializable_hash.to_json
  end

  def create
    session = WorkoutSession.new(session_params)
    session.status = :in_progress

    if session.save
      render json: WorkoutSessionSerializer.new(session).serializable_hash.to_json, status: :created
    else
      render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @session.update(session_params)
      render json: WorkoutSessionSerializer.new(@session, include: [:session_exercises]).serializable_hash.to_json
    else
      render json: { errors: @session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @session.destroy
    head :no_content
  end

  private

  def set_session
    @session = WorkoutSession.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Workout session not found' }, status: :not_found
  end

  def session_params
    params.require(:workout_session).permit(:name, :started_at, :ended_at, :status)
  end
end
```

- [ ] **Step 5: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/requests/api/v1/workout_sessions_spec.rb
```

Expected: all examples PASS

- [ ] **Step 6: Commit**

```bash
git add server/ && git commit -m "feat: add Workout Sessions API with summary endpoint"
```

---

## Task 5: Session Exercises and Session Exercise Logs APIs

**Files:**
- Create: `server/app/controllers/api/v1/session_exercises_controller.rb`
- Create: `server/app/controllers/api/v1/session_exercise_logs_controller.rb`
- Create: `server/spec/requests/api/v1/session_exercises_spec.rb`
- Create: `server/spec/requests/api/v1/session_exercise_logs_spec.rb`

- [ ] **Step 1: Write failing request specs for Session Exercises**

Create `server/spec/requests/api/v1/session_exercises_spec.rb`:

```ruby
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
```

- [ ] **Step 2: Write failing request specs for Session Exercise Logs**

Create `server/spec/requests/api/v1/session_exercise_logs_spec.rb`:

```ruby
require 'rails_helper'

RSpec.describe 'Api::V1::SessionExerciseLogs', type: :request do
  let(:session) { create(:workout_session) }
  let(:exercise) { create(:exercise) }
  let(:session_exercise) { create(:session_exercise, workout_session: session, exercise: exercise) }

  describe 'POST /api/v1/workout_sessions/:session_id/session_exercises/:session_exercise_id/logs' do
    it 'creates a log entry' do
      params = { session_exercise_log: { values: { 'reps' => 10, 'weight' => 135 } } }

      expect {
        post "/api/v1/workout_sessions/#{session.id}/session_exercises/#{session_exercise.id}/logs", params: params
      }.to change(SessionExerciseLog, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['values']['reps']).to eq(10)
    end
  end

  describe 'PUT /api/v1/workout_sessions/:session_id/session_exercises/:session_exercise_id/logs/:id' do
    it 'updates a log entry' do
      log = create(:session_exercise_log, session_exercise: session_exercise, values: { 'reps' => 10 })

      put "/api/v1/workout_sessions/#{session.id}/session_exercises/#{session_exercise.id}/logs/#{log.id}", params: { session_exercise_log: { values: { 'reps' => 12 } } }

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
```

- [ ] **Step 3: Run specs to verify they fail**

```bash
cd server && bundle exec rspec spec/requests/api/v1/session_exercises_spec.rb spec/requests/api/v1/session_exercise_logs_spec.rb
```

Expected: FAIL

- [ ] **Step 4: Create SessionExercises controller**

Create `server/app/controllers/api/v1/session_exercises_controller.rb`:

```ruby
class Api::V1::SessionExercisesController < ApplicationController
  before_action :set_session
  before_action :set_session_exercise, only: [:update, :destroy]

  def create
    se = @session.session_exercises.build(session_exercise_params)

    if se.save
      render json: SessionExerciseSerializer.new(se, include: [:exercise]).serializable_hash.to_json, status: :created
    else
      render json: { errors: se.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @session_exercise.update(session_exercise_params)
      render json: SessionExerciseSerializer.new(@session_exercise).serializable_hash.to_json
    else
      render json: { errors: @session_exercise.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @session_exercise.destroy
    head :no_content
  end

  private

  def set_session
    @session = WorkoutSession.find(params[:workout_session_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Workout session not found' }, status: :not_found
  end

  def set_session_exercise
    @session_exercise = @session.session_exercises.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Session exercise not found' }, status: :not_found
  end

  def session_exercise_params
    params.require(:session_exercise).permit(:exercise_id, :position, :notes)
  end
end
```

- [ ] **Step 5: Create SessionExerciseLogs controller**

Create `server/app/controllers/api/v1/session_exercise_logs_controller.rb`:

```ruby
class Api::V1::SessionExerciseLogsController < ApplicationController
  before_action :set_session
  before_action :set_session_exercise
  before_action :set_log, only: [:update, :destroy]

  def create
    log = @session_exercise.session_exercise_logs.build(log_params)

    if log.save
      render json: SessionExerciseLogSerializer.new(log).serializable_hash.to_json, status: :created
    else
      render json: { errors: log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @log.update(log_params)
      render json: SessionExerciseLogSerializer.new(@log).serializable_hash.to_json
    else
      render json: { errors: @log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @log.destroy
    head :no_content
  end

  private

  def set_session
    @session = WorkoutSession.find(params[:workout_session_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Workout session not found' }, status: :not_found
  end

  def set_session_exercise
    @session_exercise = @session.session_exercises.find(params[:session_exercise_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Session exercise not found' }, status: :not_found
  end

  def set_log
    @log = @session_exercise.session_exercise_logs.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Log not found' }, status: :not_found
  end

  def log_params
    params.require(:session_exercise_log).permit(:notes, values: {})
  end
end
```

- [ ] **Step 6: Run specs to verify they pass**

```bash
cd server && bundle exec rspec spec/requests/api/v1/session_exercises_spec.rb spec/requests/api/v1/session_exercise_logs_spec.rb
```

Expected: all examples PASS

- [ ] **Step 7: Commit**

```bash
git add server/ && git commit -m "feat: add Session Exercises and Session Exercise Logs APIs"
```

---

## Task 6: Progress API

**Files:**
- Create: `server/app/controllers/api/v1/progress_controller.rb`
- Create: `server/spec/requests/api/v1/progress_spec.rb`

- [ ] **Step 1: Write failing request specs for Progress**

Create `server/spec/requests/api/v1/progress_spec.rb`:

```ruby
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
  end
end
```

- [ ] **Step 2: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/requests/api/v1/progress_spec.rb
```

Expected: FAIL

- [ ] **Step 3: Create Progress controller**

Create `server/app/controllers/api/v1/progress_controller.rb`:

```ruby
class Api::V1::ProgressController < ApplicationController
  def exercise_history
    exercise = Exercise.find(params[:exercise_id])
    logs = SessionExerciseLog
      .joins(session_exercise: :workout_session)
      .where(session_exercises: { exercise_id: exercise.id })
      .order('workout_sessions.started_at ASC')

    data_points = logs.map do |log|
      {
        date: log.session_exercise.workout_session.started_at.iso8601,
        values: log.values,
        session_id: log.session_exercise.workout_session_id
      }
    end

    render json: {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      data_points: data_points
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Exercise not found' }, status: :not_found
  end
end
```

- [ ] **Step 4: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/requests/api/v1/progress_spec.rb
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/ && git commit -m "feat: add Progress API with exercise time-series endpoint"
```

---

## Task 7: Full Backend Spec Suite

- [ ] **Step 1: Run all specs**

```bash
cd server && bundle exec rspec
```

Expected: all examples PASS, 0 failures

- [ ] **Step 2: Verify all routes exist**

```bash
cd server && rails routes | grep api/v1
```

Expected: routes for exercises, workout_templates, workout_sessions (with nested session_exercises and logs), progress, and summary.
