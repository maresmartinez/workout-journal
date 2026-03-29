class Api::V1::WorkoutTemplatesController < ApplicationController
  before_action :set_template, only: [ :show, :update, :destroy ]

  def index
    templates = WorkoutTemplate.all
    render json: WorkoutTemplateSerializer.new(templates, include: [ :workout_template_exercises ]).serializable_hash.to_json
  end

  def show
    render json: WorkoutTemplateSerializer.new(@template, include: [ :workout_template_exercises, :'workout_template_exercises.exercise' ]).serializable_hash.to_json
  end

  def create
    template = WorkoutTemplate.new(template_params)

    if template.save
      render json: WorkoutTemplateSerializer.new(template, include: [ :workout_template_exercises ]).serializable_hash.to_json, status: :created
    else
      render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @template.update(template_params)
      render json: WorkoutTemplateSerializer.new(@template, include: [ :workout_template_exercises ]).serializable_hash.to_json
    else
      render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @template.destroy
    head :no_content
  end

  private

  def set_template
    @template = WorkoutTemplate.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Workout template not found" }, status: :not_found
  end

  def template_params
    params.require(:workout_template).permit(:name, :description, workout_template_exercises_attributes: [ :id, :exercise_id, :position, :notes, :_destroy ])
  end
end
