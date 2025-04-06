import { Component } from '@angular/core';

@Component({
  selector: 'app-nutritions',
  templateUrl: './nutritions.component.html',
  styleUrls: ['./nutritions.component.css']
import { Input } from '@angular/core';

export interface DailyNutrition {
  date: string;
  targetCalories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  waterIntake: number;
}

@Component({
  selector: 'app-nutritions',
  templateUrl: './nutritions.component.html',
  styleUrls: ['./nutritions.component.css']
})
export class NutritionsComponent {
  @Input() nutritionPlan: DailyNutrition[] = [];
}
