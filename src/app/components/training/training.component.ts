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
  styleUrls: ['./training.component.scss']
})
export class TrainingComponent {
  @Input() exercisePlan!: ExercisePlan;
}
