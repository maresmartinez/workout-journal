class CreateExercises < ActiveRecord::Migration[7.0]
  def change
    create_table :exercises do |t|
      t.string :name, null: false
      t.text :description
      t.integer :exercise_type, null: false, default: 0
      t.references :user, null: true

      t.timestamps
    end
  end
end
