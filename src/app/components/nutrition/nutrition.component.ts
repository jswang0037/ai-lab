import { Component, Input } from '@angular/core';

export interface DailyNutrition {
  notes: string;
  dailyTargets: {
    targetCalories: number;
    proteinInGrams: number;
    carbohydrateInGrams: number;
    fatInGrams: number;
    waterInMilliliters: number;
  }
}

@Component({
  selector: 'app-nutrition',
  templateUrl: './nutrition.component.html',
  styleUrls: ['./nutrition.component.scss']
})
export class NutritionComponent {
  @Input() nutritionPlan!: DailyNutrition;

}
