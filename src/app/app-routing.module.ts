import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
// Placeholder components, will be replaced later
import { NutritionComponent } from './components/nutrition/nutrition.component';
import { TrainingComponent } from './components/training/training.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'nutrition', component: NutritionComponent },
      { path: 'training', component: TrainingComponent },
      { path: '', redirectTo: '/nutrition', pathMatch: 'full' }, // Default route
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
