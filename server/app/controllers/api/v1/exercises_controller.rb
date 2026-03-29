class Api::V1::ExercisesController < ApplicationController
  before_action :set_exercise, only: [ :show, :update, :destroy ]

  def index
    exercises = Exercise.all
    render json: ExerciseSerializer.new(exercises, include: [ :exercise_metrics ]).serializable_hash.to_json
  end

  def show
    render json: ExerciseSerializer.new(@exercise, include: [ :exercise_metrics ]).serializable_hash.to_json
  end

  def create
    exercise = Exercise.new(exercise_params)
    exercise.exercise_type = :custom

    if exercise.save
      render json: ExerciseSerializer.new(exercise, include: [ :exercise_metrics ]).serializable_hash.to_json, status: :created
    else
      render json: { errors: exercise.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @exercise.built_in?
      render json: { error: "Cannot modify built-in exercises" }, status: :forbidden and return
    end

    if @exercise.update(exercise_params)
      render json: ExerciseSerializer.new(@exercise, include: [ :exercise_metrics ]).serializable_hash.to_json
    else
      render json: { errors: @exercise.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @exercise.built_in?
      render json: { error: "Cannot delete built-in exercises" }, status: :forbidden and return
    end

    @exercise.destroy
    head :no_content
  end

  private

  def set_exercise
    @exercise = Exercise.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Exercise not found" }, status: :not_found
  end

  def exercise_params
    params.require(:exercise).permit(:name, :description, exercise_metrics_attributes: [ :id, :name, :metric_type, :unit, :required, :_destroy ])
  end
end
