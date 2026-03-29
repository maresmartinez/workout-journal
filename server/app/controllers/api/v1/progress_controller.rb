class Api::V1::ProgressController < ApplicationController
  def exercise_history
    exercise = Exercise.find(params[:exercise_id])
    logs = SessionExerciseLog
      .joins(session_exercise: :workout_session)
      .where(session_exercises: { exercise_id: exercise.id })
      .order("workout_sessions.started_at ASC")

    data_points = logs.map do |log|
      {
        date: log.session_exercise.workout_session.started_at.iso8601,
        values: log.values,
        session_id: log.session_exercise.workout_session_id
      }
    end

    render json: {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      data_points: data_points
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Exercise not found" }, status: :not_found
  end
end
