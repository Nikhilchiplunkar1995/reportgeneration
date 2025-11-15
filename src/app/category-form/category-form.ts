
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { DataService } from '../services/data.service';
import { Category } from '../models/category';

@Component({
  selector: 'app-category-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.html',
  styleUrls: ['./category-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categoryForm = this.fb.group({
    id: [null as number | null],
    name: ['', Validators.required],
  });

  category = signal<Category | undefined>(undefined);

  isEditMode = computed(() => this.category() !== undefined);

  constructor() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.dataService.getCategoryById(Number(id));
        }
        return of(undefined);
      })
    ).subscribe(category => {
      if (category) {
        this.category.set(category);
        this.categoryForm.patchValue(category);
      }
    });
  }

  getErrorMessage(controlName: string) {
    const control = this.categoryForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required.';
    }
    return '';
  }

  onSubmit() {
    if (this.categoryForm.invalid) {
        this.categoryForm.markAllAsTouched();
        return;
    }

    const formValue = this.categoryForm.value;
    const categoryData: Category = {
        id: this.category()?.id ?? 0,
        name: formValue.name!,
    };

    if (this.isEditMode()) {
      this.dataService.updateCategory(categoryData).subscribe(() => {
        this.router.navigate(['/categories']);
      });
    } else {
      this.dataService.createCategory(categoryData).subscribe(() => {
        this.router.navigate(['/categories']);
      });
    }
  }

  cancel() {
    this.router.navigate(['/categories']);
  }
}
