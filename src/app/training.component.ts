import { Component } from '@angular/core';

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
import { Input, OnInit } from '@angular/core';

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WeeklyPlan {
  day: string;
  exercises: Exercise[];
}

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
})
export class TrainingComponent implements OnInit {
  @Input() exercisePlan: WeeklyPlan[] = [];

  ngOnInit() {
    // Example data (replace with actual input)
    this.exercisePlan = [
      {
        day: 'Monday',
        exercises: [
          { name: 'Squats', sets: 3, reps: 10, weight: 50 },
          { name: 'Bench Press', sets: 3, reps: 8, weight: 60 },
          { name: 'Barbell Rows', sets: 3, reps: 12, weight: 40 }
        ]
      },
      {
        day: 'Tuesday',
        exercises: [
          { name: 'Overhead Press', sets: 3, reps: 10, weight: 30 },
          { name: 'Deadlifts', sets: 1, reps: 5, weight: 100 },
          { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 }
        ]
      }
    ];
  }
}
