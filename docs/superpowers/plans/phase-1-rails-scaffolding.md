# Phase 1: Rails Scaffolding, Models, Migrations

**Goal:** Initialize Rails API-only app with PostgreSQL, create all models with migrations, associations, and validations.

**Verification:** `cd server && bundle exec rspec` passes all model specs.

---

## Task 1: Initialize Rails App

**Files:**
- Create: `server/` (entire Rails app skeleton)

- [x] **Step 1: Create the Rails API app**

```bash
rails new server --api --database=postgresql --skip-test --skip-javascript
```

- [x] **Step 2: Add RSpec to Gemfile**

Add to `server/Gemfile` in the `:development, :test` group:

```ruby
gem 'rspec-rails', '~> 6.0'
```

- [x] **Step 3: Install and setup RSpec**

```bash
cd server && bundle install && rails generate rspec:install
```

- [x] **Step 4: Verify Rails app boots**

```bash
cd server && rails db:create && rails runner 'puts "OK"'
```

Expected: `OK`

- [x] **Step 5: Commit**

```bash
git add server/ && git commit -m "chore: initialize Rails 7 API-only app with PostgreSQL and RSpec"
```

---

## Task 2: Exercise and ExerciseMetric Models

**Files:**
- Create: `server/app/models/exercise.rb`
- Create: `server/app/models/exercise_metric.rb`
- Create: `server/db/migrate/*_create_exercises.rb`
- Create: `server/db/migrate/*_create_exercise_metrics.rb`
- Create: `server/spec/models/exercise_spec.rb`
- Create: `server/spec/models/exercise_metric_spec.rb`

- [x] **Step 1: Write failing Exercise model spec**

Create `server/spec/models/exercise_spec.rb`:

```ruby
require 'rails_helper'

RSpec.describe Exercise, type: :model do
  it 'has a valid factory' do
    exercise = Exercise.new(name: 'Bench Press', exercise_type: 'built_in')
    expect(exercise).to be_valid
  end

  it 'is invalid without a name' do
    exercise = Exercise.new(name: nil, exercise_type: 'built_in')
    expect(exercise).not_to be_valid
    expect(exercise.errors[:name]).to include("can't be blank")
  end

  it 'is invalid without an exercise_type' do
    exercise = Exercise.new(name: 'Bench Press', exercise_type: nil)
    expect(exercise).not_to be_valid
    expect(exercise.errors[:exercise_type]).to include("can't be blank")
  end

  it 'is invalid with an unrecognized exercise_type' do
    exercise = Exercise.new(name: 'Bench Press', exercise_type: 'invalid')
    expect(exercise).not_to be_valid
  end

  it 'allows built_in type' do
    exercise = Exercise.new(name: 'Squat', exercise_type: 'built_in')
    expect(exercise).to be_valid
  end

  it 'allows custom type' do
    exercise = Exercise.new(name: 'My Move', exercise_type: 'custom')
    expect(exercise).to be_valid
  end

  it 'has many exercise_metrics' do
    association = Exercise.reflect_on_association(:exercise_metrics)
    expect(association.macro).to eq(:has_many)
  end

  it 'destroys dependent exercise_metrics' do
    exercise = Exercise.create!(name: 'Test', exercise_type: 'built_in')
    exercise.exercise_metrics.create!(name: 'reps', metric_type: 'integer')
    expect { exercise.destroy }.to change(ExerciseMetric, :count).by(-1)
  end
end
```

- [x] **Step 2: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/models/exercise_spec.rb
```

Expected: FAIL — uninitialized constant `Exercise`

- [x] **Step 3: Generate Exercise model and run migration**

```bash
cd server && rails generate model Exercise name:string description:text exercise_type:integer user:references
```

Edit the generated migration to set `exercise_type` default and make `user_id` nullable:

```ruby
class CreateExercises < ActiveRecord::Migration[7.0]
  def change
    create_table :exercises do |t|
      t.string :name, null: false
      t.text :description
      t.integer :exercise_type, null: false, default: 0
      t.references :user, foreign_key: true, null: true

      t.timestamps
    end
  end
end
```

```bash
cd server && rails db:migrate
```

Edit `server/app/models/exercise.rb`:

```ruby
class Exercise < ApplicationRecord
  enum exercise_type: { built_in: 0, custom: 1 }

  validates :name, presence: true
  validates :exercise_type, presence: true

  has_many :exercise_metrics, dependent: :destroy
end
```

- [x] **Step 4: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/models/exercise_spec.rb
```

Expected: all examples PASS

- [x] **Step 5: Write failing ExerciseMetric model spec**

Create `server/spec/models/exercise_metric_spec.rb`:

```ruby
require 'rails_helper'

RSpec.describe ExerciseMetric, type: :model do
  let(:exercise) { Exercise.create!(name: 'Bench Press', exercise_type: 'built_in') }

  it 'is valid with required attributes' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: 'integer')
    expect(metric).to be_valid
  end

  it 'is invalid without a name' do
    metric = exercise.exercise_metrics.new(name: nil, metric_type: 'integer')
    expect(metric).not_to be_valid
  end

  it 'is invalid without a metric_type' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: nil)
    expect(metric).not_to be_valid
  end

  it 'is invalid with unrecognized metric_type' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: 'floaty')
    expect(metric).not_to be_valid
  end

  it 'allows integer metric_type' do
    metric = exercise.exercise_metrics.new(name: 'sets', metric_type: 'integer')
    expect(metric).to be_valid
  end

  it 'allows decimal metric_type' do
    metric = exercise.exercise_metrics.new(name: 'weight', metric_type: 'decimal')
    expect(metric).to be_valid
  end

  it 'allows text metric_type' do
    metric = exercise.exercise_metrics.new(name: 'notes', metric_type: 'text')
    expect(metric).to be_valid
  end

  it 'belongs to exercise' do
    association = ExerciseMetric.reflect_on_association(:exercise)
    expect(association.macro).to eq(:belongs_to)
  end

  it 'unit is optional' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: 'integer', unit: nil)
    expect(metric).to be_valid
  end

  it 'required defaults to false' do
    metric = exercise.exercise_metrics.new(name: 'reps', metric_type: 'integer')
    expect(metric.required).to eq(false)
  end
end
```

- [x] **Step 6: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/models/exercise_metric_spec.rb
```

Expected: FAIL — uninitialized constant `ExerciseMetric`

- [x] **Step 7: Generate ExerciseMetric model and run migration**

```bash
cd server && rails generate model ExerciseMetric exercise:references name:string metric_type:integer unit:string required:boolean
```

Edit the generated migration:

```ruby
class CreateExerciseMetrics < ActiveRecord::Migration[7.0]
  def change
    create_table :exercise_metrics do |t|
      t.references :exercise, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :metric_type, null: false, default: 0
      t.string :unit
      t.boolean :required, default: false, null: false

      t.timestamps
    end
  end
end
```

```bash
cd server && rails db:migrate
```

Edit `server/app/models/exercise_metric.rb`:

```ruby
class ExerciseMetric < ApplicationRecord
  enum metric_type: { integer: 0, decimal: 1, text: 2 }

  validates :name, presence: true
  validates :metric_type, presence: true

  belongs_to :exercise
end
```

- [x] **Step 8: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/models/exercise_metric_spec.rb
```

Expected: all examples PASS

- [x] **Step 9: Commit**

```bash
git add server/ && git commit -m "feat: add Exercise and ExerciseMetric models with validations"
```

---

## Task 3: WorkoutTemplate and WorkoutTemplateExercise Models

**Files:**
- Create: `server/app/models/workout_template.rb`
- Create: `server/app/models/workout_template_exercise.rb`
- Create: `server/spec/models/workout_template_spec.rb`
- Create: `server/spec/models/workout_template_exercise_spec.rb`

- [x] **Step 1: Write failing WorkoutTemplate model spec**

Create `server/spec/models/workout_template_spec.rb`:

```ruby
require 'rails_helper'

RSpec.describe WorkoutTemplate, type: :model do
  it 'is valid with a name' do
    template = WorkoutTemplate.new(name: 'Push Day')
    expect(template).to be_valid
  end

  it 'is invalid without a name' do
    template = WorkoutTemplate.new(name: nil)
    expect(template).not_to be_valid
    expect(template.errors[:name]).to include("can't be blank")
  end

  it 'has many workout_template_exercises' do
    association = WorkoutTemplate.reflect_on_association(:workout_template_exercises)
    expect(association.macro).to eq(:has_many)
  end

  it 'destroys dependent workout_template_exercises' do
    template = WorkoutTemplate.create!(name: 'Test')
    exercise = Exercise.create!(name: 'Squat', exercise_type: 'built_in')
    template.workout_template_exercises.create!(exercise: exercise, position: 1)
    expect { template.destroy }.to change(WorkoutTemplateExercise, :count).by(-1)
  end
end
```

- [x] **Step 2: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/models/workout_template_spec.rb
```

Expected: FAIL

- [x] **Step 3: Generate WorkoutTemplate model and implement**

```bash
cd server && rails generate model WorkoutTemplate name:string description:text user:references
```

Edit the migration:

```ruby
class CreateWorkoutTemplates < ActiveRecord::Migration[7.0]
  def change
    create_table :workout_templates do |t|
      t.string :name, null: false
      t.text :description
      t.references :user, foreign_key: true, null: true

      t.timestamps
    end
  end
end
```

```bash
cd server && rails db:migrate
```

Edit `server/app/models/workout_template.rb`:

```ruby
class WorkoutTemplate < ApplicationRecord
  validates :name, presence: true

  has_many :workout_template_exercises, dependent: :destroy
end
```

- [x] **Step 4: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/models/workout_template_spec.rb
```

Expected: PASS

- [x] **Step 5: Write failing WorkoutTemplateExercise model spec**

Create `server/spec/models/workout_template_exercise_spec.rb`:

```ruby
require 'rails_helper'

RSpec.describe WorkoutTemplateExercise, type: :model do
  let(:template) { WorkoutTemplate.create!(name: 'Push Day') }
  let(:exercise) { Exercise.create!(name: 'Bench Press', exercise_type: 'built_in') }

  it 'is valid with required attributes' do
    wte = WorkoutTemplateExercise.new(
      workout_template: template,
      exercise: exercise,
      position: 1
    )
    expect(wte).to be_valid
  end

  it 'is invalid without a position' do
    wte = WorkoutTemplateExercise.new(
      workout_template: template,
      exercise: exercise,
      position: nil
    )
    expect(wte).not_to be_valid
  end

  it 'belongs to workout_template' do
    association = WorkoutTemplateExercise.reflect_on_association(:workout_template)
    expect(association.macro).to eq(:belongs_to)
  end

  it 'belongs to exercise' do
    association = WorkoutTemplateExercise.reflect_on_association(:exercise)
    expect(association.macro).to eq(:belongs_to)
  end
end
```

- [x] **Step 6: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/models/workout_template_exercise_spec.rb
```

Expected: FAIL

- [x] **Step 7: Generate WorkoutTemplateExercise model and implement**

```bash
cd server && rails generate model WorkoutTemplateExercise workout_template:references exercise:references position:integer notes:text
```

Edit the migration:

```ruby
class CreateWorkoutTemplateExercises < ActiveRecord::Migration[7.0]
  def change
    create_table :workout_template_exercises do |t|
      t.references :workout_template, null: false, foreign_key: true
      t.references :exercise, null: false, foreign_key: true
      t.integer :position, null: false
      t.text :notes

      t.timestamps
    end
  end
end
```

```bash
cd server && rails db:migrate
```

Edit `server/app/models/workout_template_exercise.rb`:

```ruby
class WorkoutTemplateExercise < ApplicationRecord
  validates :position, presence: true

  belongs_to :workout_template
  belongs_to :exercise
end
```

- [x] **Step 8: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/models/workout_template_exercise_spec.rb
```

Expected: PASS

- [x] **Step 9: Commit**

```bash
git add server/ && git commit -m "feat: add WorkoutTemplate and WorkoutTemplateExercise models"
```

---

## Task 4: WorkoutSession, SessionExercise, and SessionExerciseLog Models

**Files:**
- Create: `server/app/models/workout_session.rb`
- Create: `server/app/models/session_exercise.rb`
- Create: `server/app/models/session_exercise_log.rb`
- Create: `server/spec/models/workout_session_spec.rb`
- Create: `server/spec/models/session_exercise_spec.rb`
- Create: `server/spec/models/session_exercise_log_spec.rb`

- [x] **Step 1: Write failing WorkoutSession model spec**

Create `server/spec/models/workout_session_spec.rb`:

```ruby
require 'rails_helper'

RSpec.describe WorkoutSession, type: :model do
  it 'is valid with started_at' do
    session = WorkoutSession.new(started_at: Time.current, status: 'in_progress')
    expect(session).to be_valid
  end

  it 'is invalid without started_at' do
    session = WorkoutSession.new(started_at: nil, status: 'in_progress')
    expect(session).not_to be_valid
  end

  it 'defaults status to in_progress' do
    session = WorkoutSession.new(started_at: Time.current)
    expect(session.status).to eq('in_progress')
  end

  it 'allows in_progress status' do
    session = WorkoutSession.new(started_at: Time.current, status: 'in_progress')
    expect(session).to be_valid
  end

  it 'allows completed status' do
    session = WorkoutSession.new(started_at: Time.current, status: 'completed')
    expect(session).to be_valid
  end

  it 'allows abandoned status' do
    session = WorkoutSession.new(started_at: Time.current, status: 'abandoned')
    expect(session).to be_valid
  end

  it 'has many session_exercises' do
    association = WorkoutSession.reflect_on_association(:session_exercises)
    expect(association.macro).to eq(:has_many)
  end

  it 'destroys dependent session_exercises' do
    session = WorkoutSession.create!(started_at: Time.current)
    exercise = Exercise.create!(name: 'Squat', exercise_type: 'built_in')
    session.session_exercises.create!(exercise: exercise, position: 1)
    expect { session.destroy }.to change(SessionExercise, :count).by(-1)
  end
end
```

- [x] **Step 2: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/models/workout_session_spec.rb
```

Expected: FAIL

- [x] **Step 3: Generate WorkoutSession model and implement**

```bash
cd server && rails generate model WorkoutSession name:string started_at:datetime ended_at:datetime status:integer user:references
```

Edit the migration:

```ruby
class CreateWorkoutSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :workout_sessions do |t|
      t.string :name
      t.datetime :started_at, null: false
      t.datetime :ended_at
      t.integer :status, null: false, default: 0
      t.references :user, foreign_key: true, null: true

      t.timestamps
    end
  end
end
```

```bash
cd server && rails db:migrate
```

Edit `server/app/models/workout_session.rb`:

```ruby
class WorkoutSession < ApplicationRecord
  enum status: { in_progress: 0, completed: 1, abandoned: 2 }

  validates :started_at, presence: true

  has_many :session_exercises, dependent: :destroy
end
```

- [x] **Step 4: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/models/workout_session_spec.rb
```

Expected: PASS

- [x] **Step 5: Write failing SessionExercise model spec**

Create `server/spec/models/session_exercise_spec.rb`:

```ruby
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
```

- [x] **Step 6: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/models/session_exercise_spec.rb
```

Expected: FAIL

- [x] **Step 7: Generate SessionExercise model and implement**

```bash
cd server && rails generate model SessionExercise workout_session:references exercise:references position:integer notes:text
```

Edit the migration:

```ruby
class CreateSessionExercises < ActiveRecord::Migration[7.0]
  def change
    create_table :session_exercises do |t|
      t.references :workout_session, null: false, foreign_key: true
      t.references :exercise, null: false, foreign_key: true
      t.integer :position, null: false
      t.text :notes

      t.timestamps
    end
  end
end
```

```bash
cd server && rails db:migrate
```

Edit `server/app/models/session_exercise.rb`:

```ruby
class SessionExercise < ApplicationRecord
  validates :position, presence: true

  belongs_to :workout_session
  belongs_to :exercise

  has_many :session_exercise_logs, dependent: :destroy
end
```

- [x] **Step 8: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/models/session_exercise_spec.rb
```

Expected: PASS

- [x] **Step 9: Write failing SessionExerciseLog model spec**

Create `server/spec/models/session_exercise_log_spec.rb`:

```ruby
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
```

- [x] **Step 10: Run spec to verify it fails**

```bash
cd server && bundle exec rspec spec/models/session_exercise_log_spec.rb
```

Expected: FAIL

- [x] **Step 11: Generate SessionExerciseLog model and implement**

```bash
cd server && rails generate model SessionExerciseLog session_exercise:references values:jsonb notes:text
```

Edit the migration:

```ruby
class CreateSessionExerciseLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :session_exercise_logs do |t|
      t.references :session_exercise, null: false, foreign_key: true
      t.jsonb :values, null: false, default: {}
      t.text :notes

      t.timestamps
    end

    add_index :session_exercise_logs, :values, using: :gin
  end
end
```

```bash
cd server && rails db:migrate
```

Edit `server/app/models/session_exercise_log.rb`:

```ruby
class SessionExerciseLog < ApplicationRecord
  belongs_to :session_exercise
end
```

- [x] **Step 12: Run spec to verify it passes**

```bash
cd server && bundle exec rspec spec/models/session_exercise_log_spec.rb
```

Expected: PASS

- [x] **Step 13: Commit**

```bash
git add server/ && git commit -m "feat: add WorkoutSession, SessionExercise, and SessionExerciseLog models"
```

---

## Task 5: Run Full Model Spec Suite

- [x] **Step 1: Run all model specs**

```bash
cd server && bundle exec rspec spec/models/
```

Expected: all examples PASS, 0 failures

- [x] **Step 2: Verify schema completeness**

```bash
cd server && rails runner 'puts ActiveRecord::Base.connection.tables.sort'
```

Expected output includes: `exercises`, `exercise_metrics`, `workout_templates`, `workout_template_exercises`, `workout_sessions`, `session_exercises`, `session_exercise_logs`
