
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-products',
  imports: [CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent {
  private dataService = inject(DataService);
  private products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  searchQuery = signal<string>('');
  selectedCategory = signal<Category | null>(null);

  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    return this.products().filter(product => {
      const matchesQuery = product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query);
      const matchesCategory = !category || product.categoryId === category.id;
      return matchesQuery && matchesCategory;
    });
  });

  constructor() {
    this.dataService.getProducts().subscribe(products => {
      this.products.set(products);
    });
    this.dataService.getCategories().subscribe(categories => {
      this.categories.set(categories);
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onSelectCategory(category: Category | null) {
    this.selectedCategory.set(category);
  }
}
