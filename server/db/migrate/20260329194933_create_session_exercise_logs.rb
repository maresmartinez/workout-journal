class CreateSessionExerciseLogs < ActiveRecord::Migration[8.1]
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
