import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrainingComponent } from './training.component';
import { NutritionsComponent } from './nutritions.component';

const routes: Routes = [
  { path: 'training', component: TrainingComponent },
  { path: 'nutritions', component: NutritionsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
