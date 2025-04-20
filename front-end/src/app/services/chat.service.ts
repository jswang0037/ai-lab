import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Added HttpErrorResponse
import { Observable, throwError } from 'rxjs'; // Added throwError
import { catchError } from 'rxjs/operators'; // Added catchError
// Environment import will be added later (Step 3)
import { environment } from '../../environments/environment'; // Added Step 3

// --- Interfaces (Step 2) ---

export interface Content {
  role: 'user' | 'model';
  text: string;
}

export interface Question {
  text: string;
  options: string[];
}

// Simplified based on backend JSON structure
export interface Exercise {
  name: string;
  equipment: string[];
  sets: number;
  reps: number | string; // Can be number or range like "8-12"
  weightInKgs?: number; // Optional
  restBetweenSetsSeconds: number;
  instructions: string;
  // Match backend naming inconsistencies if necessary, e.g., exerciseName
  exerciseName?: string;
  targetSets?: number;
  targetReps?: number | string;
  targetWeightKg?: number;
}

export interface WeeklySchedule {
  dayOfWeek: string; // e.g., "Monday" or "Day 1"
  workoutType: string;
  estimatedDurationMinutes: number;
  exercises: Exercise[];
}

export interface ExercisePlan {
  notes: string;
  weeklySchedule: WeeklySchedule[];
}

export interface DailyNutrition {
  notes: string;
  dailyTargets: {
    targetCalories: number;
    proteinInGrams: number;
    carbohydrateInGrams: number;
    fatInGrams: number;
    waterInMilliliters: number;
  };
}

// Type for the /parse endpoint response
export type ParseResponse = Question[] | { exercisePlan?: ExercisePlan; nutritionPlan?: DailyNutrition };


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // Backend URL from environment (Step 3)
  private backendUrl = environment.backendUrl; // e.g., 'http://localhost:8000'

  constructor(private http: HttpClient) { }

  // --- Service Methods (Step 2 & 6) ---

  /**
   * Sends chat history and new message to the backend /chat endpoint.
   */
  sendChatMessage(history: Content[], text: string): Observable<string> {
    const url = `${this.backendUrl}/chat`;
    const payload = { contents: history, text: text };

    console.log("Sending to /chat:", payload); // Log request

    // Use { responseType: 'text' } because the backend returns plain text
    return this.http.post(url, payload, { responseType: 'text' }).pipe(
      catchError(this.handleError) // Add error handling (Step 6)
    );
  }

  /**
   * Sends text to the backend /parse endpoint for processing.
   * Expects either a Question array or an object with plans.
   */
  parseResponseText(text: string): Observable<ParseResponse> {
    const url = `${this.backendUrl}/parse`;
    const payload = { text: text };

    console.log("Sending to /parse:", payload); // Log request

    // Expecting JSON response, default behavior of HttpClient
    return this.http.post<ParseResponse>(url, payload).pipe(
      catchError(this.handleError) // Add error handling (Step 6)
    );
  }

  // --- Error Handling (Step 6) ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      // Backend might return plain text error or a JSON object with 'detail'
      if (typeof error.error === 'string') {
        errorMessage = `Server returned code ${error.status}, error message is: ${error.error}`;
      } else if (error.error && error.error.detail) {
         errorMessage = `Server returned code ${error.status}, error message is: ${error.error.detail}`;
      } else {
         errorMessage = `Server returned code ${error.status}`;
      }
    }
    console.error('ChatService Error:', errorMessage, error); // Log the detailed error
    // Return an observable with a user-facing error message
    // The component subscribing will receive this error
    return throwError(() => new Error(errorMessage));
  }
}
