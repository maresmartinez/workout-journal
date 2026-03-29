import type { Exercise, WorkoutTemplate, WorkoutSession } from '../types'

export interface JsonApiRelationship {
  id: string
  type: string
}

export interface JsonApiRelationships {
  [key: string]: {
    data?: JsonApiRelationship | JsonApiRelationship[]
  }
}

export interface JsonApiData<T> {
  id: string
  type: string
  attributes: T
  relationships?: JsonApiRelationships
}

export interface JsonApiResponse<T> {
  data: JsonApiData<T> | JsonApiData<T>[]
  included?: JsonApiData<unknown>[]
}

export interface ExercisesResponse {
  data: JsonApiData<Exercise>[]
  included?: JsonApiData<unknown>[]
}

export interface ExerciseResponse {
  data: JsonApiData<Exercise>
  included?: JsonApiData<unknown>[]
}

export interface TemplatesResponse {
  data: JsonApiData<WorkoutTemplate>[]
  included?: JsonApiData<unknown>[]
}

export interface TemplateResponse {
  data: JsonApiData<WorkoutTemplate>
  included?: JsonApiData<unknown>[]
}

export interface SessionsResponse {
  data: JsonApiData<WorkoutSession>[]
  included?: JsonApiData<unknown>[]
}

export interface SessionResponse {
  data: JsonApiData<WorkoutSession>
  included?: JsonApiData<unknown>[]
}
