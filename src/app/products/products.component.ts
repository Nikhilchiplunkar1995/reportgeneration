import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { Product } from '../models/product';
import { Category } from '../models/category';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent {
  private dataService = inject(DataService);

  products = signal<Product[]>([]);
  currentPage = signal(1);
  sortOption = signal('name');
  selectedCategory = signal('');
  categories = signal<Category[]>([]);

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.dataService.getProducts(
      10, // Using a fixed limit for now
      this.sortOption(),
      this.selectedCategory()
    ).subscribe((products: Product[]) => {
      this.products.set(products);
    });
  }

  loadCategories(): void {
    this.dataService.getCategories().subscribe((categories: Category[]) => {
      this.categories.set(categories);
    });
  }

  nextPage(): void {
    this.currentPage.set(this.currentPage() + 1);
    this.loadProducts();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadProducts();
    }
  }

  onSortChange(event: Event): void {
    this.sortOption.set((event.target as HTMLSelectElement).value);
    this.loadProducts();
  }

  onCategoryChange(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1); // Reset to first page when category changes
    this.loadProducts();
  }
}
