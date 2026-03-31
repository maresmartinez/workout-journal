# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_30_235534) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "exercise_metrics", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "exercise_id", null: false
    t.integer "metric_type", default: 0, null: false
    t.string "name", null: false
    t.boolean "required", default: false, null: false
    t.string "unit"
    t.datetime "updated_at", null: false
    t.index ["exercise_id"], name: "index_exercise_metrics_on_exercise_id"
  end

  create_table "exercises", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "exercise_type", default: 0, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["user_id"], name: "index_exercises_on_user_id"
  end

  create_table "session_exercise_logs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "notes"
    t.bigint "session_exercise_id", null: false
    t.datetime "updated_at", null: false
    t.jsonb "values", default: {}, null: false
    t.index ["session_exercise_id"], name: "index_session_exercise_logs_on_session_exercise_id"
    t.index ["values"], name: "index_session_exercise_logs_on_values", using: :gin
  end

  create_table "session_exercises", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "exercise_id", null: false
    t.text "notes"
    t.integer "position", null: false
    t.datetime "updated_at", null: false
    t.bigint "workout_session_id", null: false
    t.index ["exercise_id"], name: "index_session_exercises_on_exercise_id"
    t.index ["workout_session_id"], name: "index_session_exercises_on_workout_session_id"
  end

  create_table "workout_sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "ended_at"
    t.string "name"
    t.datetime "started_at", null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["user_id"], name: "index_workout_sessions_on_user_id"
  end

  create_table "workout_template_exercises", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "exercise_id", null: false
    t.text "notes"
    t.integer "position", null: false
    t.datetime "updated_at", null: false
    t.bigint "workout_template_id", null: false
    t.index ["exercise_id"], name: "index_workout_template_exercises_on_exercise_id"
    t.index ["workout_template_id"], name: "index_workout_template_exercises_on_workout_template_id"
  end

  create_table "workout_templates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["user_id"], name: "index_workout_templates_on_user_id"
  end

  add_foreign_key "exercise_metrics", "exercises"
  add_foreign_key "session_exercise_logs", "session_exercises"
  add_foreign_key "session_exercises", "exercises"
  add_foreign_key "session_exercises", "workout_sessions"
  add_foreign_key "workout_template_exercises", "exercises"
  add_foreign_key "workout_template_exercises", "workout_templates"
end
