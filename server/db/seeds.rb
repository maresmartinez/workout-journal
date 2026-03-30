WorkoutSession.destroy_all
WorkoutTemplate.destroy_all
Exercise.destroy_all

strength_exercises = [
  { name: 'Bench Press', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' }
  ] },
  { name: 'Squat', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' }
  ] },
  { name: 'Deadlift', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' }
  ] },
  { name: 'Overhead Press', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' }
  ] },
  { name: 'Pull-Up', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' }
  ] },
  { name: 'Barbell Row', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' }
  ] }
]

cardio_exercises = [
  { name: 'Running', metrics: [
    { name: 'duration', metric_type: :integer, unit: 'min' },
    { name: 'distance', metric_type: :decimal, unit: 'mi' }
  ] },
  { name: 'Cycling', metrics: [
    { name: 'duration', metric_type: :integer, unit: 'min' },
    { name: 'distance', metric_type: :decimal, unit: 'mi' }
  ] },
  { name: 'Jump Rope', metrics: [
    { name: 'duration', metric_type: :integer, unit: 'sec' }
  ] }
]

bodyweight_exercises = [
  { name: 'Push-Up', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer }
  ] },
  { name: 'Plank', metrics: [
    { name: 'duration', metric_type: :integer, unit: 'sec' }
  ] }
]

all_exercises = strength_exercises + cardio_exercises + bodyweight_exercises

all_exercises.each do |data|
  exercise = Exercise.create!(
    name: data[:name],
    exercise_type: :built_in
  )

  data[:metrics].each do |metric_data|
    exercise.exercise_metrics.create!(metric_data)
  end

  puts "  Created: #{exercise.name} (#{exercise.exercise_metrics.count} metrics)"
end

puts "\nSeeded #{Exercise.count} built-in exercises."
