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
