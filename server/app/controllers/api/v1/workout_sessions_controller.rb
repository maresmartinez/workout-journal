class Api::V1::WorkoutSessionsController < ApplicationController
  before_action :set_session, only: [ :show, :update, :destroy ]

  def index
    sessions = WorkoutSession.order(started_at: :desc).limit(50)
    render json: WorkoutSessionSerializer.new(sessions).serializable_hash.to_json
  end

  def summary
    total_sessions = WorkoutSession.count
    completed_sessions = WorkoutSession.where(status: :completed).count

    render json: {
      total_sessions: total_sessions,
      completed_sessions: completed_sessions
    }
  end

  def show
    render json: WorkoutSessionSerializer.new(@session, include: [ :session_exercises, :'session_exercises.exercise', :'session_exercises.session_exercise_logs' ]).serializable_hash.to_json
  end

  def create
    session = WorkoutSession.new(session_params)

    if session.save
      render json: WorkoutSessionSerializer.new(session, include: [ :session_exercises, :'session_exercises.exercise', :'session_exercises.session_exercise_logs' ]).serializable_hash.to_json, status: :created
    else
      render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def create_from_template
    template = WorkoutTemplate.find_by(id: params[:workout_template_id])
    unless template
      render json: { error: "Workout template not found" }, status: :not_found
      return
    end

    session = WorkoutSession.new(
      name: params[:name] || template.name,
      started_at: Time.current,
      status: :in_progress
    )

    ActiveRecord::Base.transaction do
      session.save!
      template.workout_template_exercises.order(:position).each do |wte|
        session.session_exercises.create!(
          exercise_id: wte.exercise_id,
          position: wte.position,
          notes: wte.notes
        )
      end
    end

    render json: WorkoutSessionSerializer.new(session, include: [ :session_exercises, :'session_exercises.exercise', :'session_exercises.session_exercise_logs' ]).serializable_hash.to_json, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    if @session.update(update_params)
      render json: WorkoutSessionSerializer.new(@session, include: [ :session_exercises ]).serializable_hash.to_json
    else
      render json: { errors: @session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @session.destroy
    head :no_content
  end

  private

  def set_session
    @session = WorkoutSession.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Workout session not found" }, status: :not_found
  end

  def session_params
    params.require(:workout_session).permit(
      :name, :started_at, :ended_at, :status,
      session_exercises_attributes: [
        :exercise_id, :position, :notes,
        { session_exercise_logs_attributes: [ { values: {} }, :notes ] }
      ]
    )
  end

  def update_params
    params.require(:workout_session).permit(:name, :started_at, :ended_at, :status)
  end
end
