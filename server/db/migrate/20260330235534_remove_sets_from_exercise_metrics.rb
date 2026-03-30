class RemoveSetsFromExerciseMetrics < ActiveRecord::Migration[8.1]
  def up
    ExerciseMetric.where(name: 'sets').delete_all
  end

  def down
    # No-op: re-seed to restore sets metrics
  end
end
