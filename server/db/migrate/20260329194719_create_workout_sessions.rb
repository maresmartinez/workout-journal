class CreateWorkoutSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :workout_sessions do |t|
      t.string :name
      t.datetime :started_at, null: false
      t.datetime :ended_at
      t.integer :status, null: false, default: 0
      t.references :user, foreign_key: false, null: true

      t.timestamps
    end
  end
end
