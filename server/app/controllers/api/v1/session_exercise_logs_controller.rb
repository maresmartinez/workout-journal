class Api::V1::SessionExerciseLogsController < ApplicationController
  before_action :set_session
  before_action :set_session_exercise
  before_action :set_log, only: [ :update, :destroy ]

  def create
    log = @session_exercise.session_exercise_logs.build(log_params)

    if log.save
      render json: SessionExerciseLogSerializer.new(log).serializable_hash.to_json, status: :created
    else
      render json: { errors: log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @log.update(log_params)
      render json: SessionExerciseLogSerializer.new(@log).serializable_hash.to_json
    else
      render json: { errors: @log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @log.destroy
    head :no_content
  end

  private

  def set_session
    @session = WorkoutSession.find(params[:workout_session_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Workout session not found" }, status: :not_found
  end

  def set_session_exercise
    @session_exercise = @session.session_exercises.find(params[:session_exercise_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Session exercise not found" }, status: :not_found
  end

  def set_log
    @log = @session_exercise.session_exercise_logs.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Log not found" }, status: :not_found
  end

  def log_params
    params.require(:session_exercise_log).permit(:notes, values: {})
  end
end
