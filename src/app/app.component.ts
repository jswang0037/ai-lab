import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HtmlService } from './services/html.service';
import { TrainingComponent, WeeklyPlan } from './training.component';
import { NutritionsComponent, DailyNutrition } from './nutritions.component';

interface Question {
  text: string;
  options: string[];
}

enum Role {
  User = 'user',
  Model = 'model'
}

interface Content {
  role: Role;
  text: string;
}

interface ChatReqAttr {
  contents: Content[];
  text: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private htmlService: HtmlService
  ) {}

  title = 'ai-lab';
  question: string = '';
  options: string[] = [];
  questions: Question[] = [
    {
      text: 'Loading...',
      options: []
    }
  ];
  history: Content[] = [];
  userTextInput = '';
  url = 'http://localhost:8000';
  isLoading = true;

  exercisePlan: WeeklyPlan[] = []; // Initialize with empty array
  nutritionPlan: DailyNutrition[] = []; // Initialize with empty array


  submit() {
    const response = this.htmlService.getRadioChecked('options');
    this.chat(response);
    this.htmlService.setInputValue('question-text-input', '');
  }

  parseQuestion(text: string) {
    const body = {
      text: text
    };
    this.http.post(this.url + '/parse', body).subscribe(res => {
      if (Array.isArray(res) && res.length > 0 && 'text' in res[0] && 'options' in res[0]) {
        this.questions = res as Question[];
      } else {
        if (res && typeof res === 'object') {
          if ('exercise_plan' in res && res.exercise_plan && 'weeklySchedule' in res.exercise_plan) {
            this.exercisePlan = this.mapExercisePlan(res.exercise_plan.weeklySchedule);
          }
          if ('nutritionPlan' in res && res.nutritionPlan && 'dailyTargets' in res.nutritionPlan) {
            this.nutritionPlan = this.mapNutritionPlan(res.nutritionPlan);
          }
        }
      }
      this.isLoading = false;
    });
  }

  mapExercisePlan(weeklySchedule: any[]): WeeklyPlan[] {
    return weeklySchedule.map(day => ({
      day: day.dayOfWeek,
      exercises: day.mainWorkout.map((exercise: any) => ({
        name: exercise.exerciseName,
        sets: exercise.targetSets,
        reps: typeof exercise.targetReps === 'string' ? 0 : exercise.targetReps, // Handle "AMRAP"
        weight: exercise.targetWeightKg
      }))
    }));
  }

  mapNutritionPlan(nutritionPlan: any): DailyNutrition[] {
    // Assuming dailyTargets is an object with the required information
    return [{
      date: nutritionPlan.startDate, // You might need a way to handle multiple days
      targetCalories: nutritionPlan.dailyTargets.targetCalories,
      protein: nutritionPlan.dailyTargets.macronutrients.proteinGrams,
      carbohydrates: nutritionPlan.dailyTargets.macronutrients.carbohydrateGrams,
      fat: nutritionPlan.dailyTargets.macronutrients.fatGrams,
      waterIntake: nutritionPlan.dailyTargets.waterIntakeMilliliters / 1000 // Convert to liters
    }];
  }


  chat(text: string) {
    this.isLoading = true;
    this.history.push({
      role: Role.User,
      text: text
    });
    const body = {
      contents: this.history,
      text: text
    };
    this.http.post<string>(this.url + '/chat', body).subscribe(res => {
      this.history.push({
        role: Role.Model,
        text: res
      });
      this.parseQuestion(res);
    });
  }

  init() {
  }

  ngOnInit(): void {
    this.history = [];
    this.chat('你好');
  }
}
