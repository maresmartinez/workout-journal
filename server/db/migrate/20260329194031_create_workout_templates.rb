class CreateWorkoutTemplates < ActiveRecord::Migration[8.1]
  def change
    create_table :workout_templates do |t|
      t.string :name, null: false
      t.text :description
      t.references :user, null: true

      t.timestamps
    end
  end
end
