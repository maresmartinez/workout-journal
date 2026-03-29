Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :exercises
      resources :workout_templates
      get "/workout_sessions/summary", to: "workout_sessions#summary"
      resources :workout_sessions do
        resources :session_exercises do
          resources :logs, controller: "session_exercise_logs"
        end
      end
      get "/progress/exercises/:exercise_id", to: "progress#exercise_history"
    end
  end
end
