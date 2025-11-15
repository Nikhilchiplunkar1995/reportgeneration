import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { Category } from '../models/category';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.html',
  styleUrls: ['./categories.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private dataService = inject(DataService);
  private router = inject(Router);
  categories = signal<Category[]>([]);

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    this.dataService.getCategories().subscribe(categories => {
      this.categories.set(categories);
    });
  }

  addCategory() {
    this.router.navigate(['/categories/new']);
  }

  editCategory(id: number) {
    this.router.navigate(['/categories', id, 'edit']);
  }

  deleteCategory(id: number) {
    this.dataService.deleteCategory(id).subscribe(() => {
      this.loadCategories();
    });
  }
}
