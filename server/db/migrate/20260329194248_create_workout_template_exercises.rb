class CreateWorkoutTemplateExercises < ActiveRecord::Migration[8.1]
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
