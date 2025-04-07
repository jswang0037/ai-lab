import { Component, Input } from '@angular/core';

export interface Exercise {
  name: string;
  equipment: string[];
  sets: number;
  reps: number;
  weightInKgs: number;
  restBetweenSetsSeconds: number;
  instructions: string;
}
export interface DailySchedule {
  dayOfWeek: string;
  workoutType: string;
  estimatedDurationMinutes: number;
  exercises: Exercise[];
}
export interface ExercisePlan {
  notes: string;
  weeklySchedule: DailySchedule[];
}

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training-styles.scss']
})
export class TrainingComponent {
import { Component, Input } from '@angular/core';

export interface Exercise {
  name: string;
  equipment: string[];
  sets: number;
  reps: number;
  weightInKgs: number;
  restBetweenSetsSeconds: number;
  instructions: string;
}
export interface DailySchedule {
  dayOfWeek: string;
  workoutType: string;
  estimatedDurationMinutes: number;
  exercises: Exercise[];
}
export interface ExercisePlan {
  notes: string;
  weeklySchedule: DailySchedule[];
+}
+
+export interface NewExercise {
+  name: string;
+  sets: number;
+  reps: number;
+  weightInKgs?: number;
+  restBetweenSetsSeconds?: number;
+  instructions?: string;
 }
 
 @Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training-styles.scss']
 })
 export class TrainingComponent {
+  @Input() exercisePlan!: ExercisePlan;
+  newExercise: NewExercise = { name: '', sets: 0, reps: 0 };
+  workoutLog: NewExercise[] = [];
+
+  addExercise() {
+    this.workoutLog.push({ ...this.newExercise });
+    this.newExercise = { name: '', sets: 0, reps: 0 };
+  }
+}
