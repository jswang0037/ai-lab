import { Component, Input } from '@angular/core';

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

export interface FoodItem {
  name: string;
  quantity: number;
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-nutrition',
  templateUrl: './nutrition.component.html',
  styleUrls: ['./nutrition.component.scss'],
})
export class NutritionComponent {
  @Input() nutritionPlan!: DailyNutrition;
  foodLog: FoodItem[] = [];
  newFood: FoodItem = { name: '', quantity: 0, protein: 0, carbs: 0, fat: 0 };

  addFoodIntake() {
    this.foodLog.push({ ...this.newFood });
    this.newFood = { name: '', quantity: 0, protein: 0, carbs: 0, fat: 0 };
  }

}
