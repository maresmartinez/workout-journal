class Api::V1::SessionExercisesController < ApplicationController
  before_action :set_session
  before_action :set_session_exercise, only: [ :update, :destroy ]

  def create
    se = @session.session_exercises.build(session_exercise_params)

    if se.save
      render json: SessionExerciseSerializer.new(se, include: [ :exercise ]).serializable_hash.to_json, status: :created
    else
      render json: { errors: se.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @session_exercise.update(session_exercise_params)
      render json: SessionExerciseSerializer.new(@session_exercise).serializable_hash.to_json
    else
      render json: { errors: @session_exercise.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @session_exercise.destroy
    head :no_content
  end

  private

  def set_session
    @session = WorkoutSession.find(params[:workout_session_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Workout session not found" }, status: :not_found
  end

  def set_session_exercise
    @session_exercise = @session.session_exercises.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Session exercise not found" }, status: :not_found
  end

  def session_exercise_params
    params.require(:session_exercise).permit(:exercise_id, :position, :notes)
  end
end
