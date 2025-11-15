
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { DataService } from '../services/data.service';
import { Category } from '../models/category';
import { Product } from '../models/product';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productForm = this.fb.group({
    id: [null as number | null],
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    categoryId: [null as number | null, Validators.required]
  });

  categories = signal<Category[]>([]);
  product = signal<Product | undefined>(undefined);
  
  isEditMode = computed(() => this.product() !== undefined);

  constructor() {
    this.dataService.getCategories().subscribe((categories: Category[]) => this.categories.set(categories));

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.dataService.getProduct(Number(id));
        }
        return of(undefined);
      })
    ).subscribe(product => {
      if (product) {
        this.product.set(product);
        this.productForm.patchValue(product);
      }
    });
  }

  getErrorMessage(controlName: string) {
    const control = this.productForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required.';
    }
    if (control?.hasError('min')) {
      return 'Please enter a positive value.';
    }
    return '';
  }

  onSubmit() {
    if (this.productForm.invalid) {
        this.productForm.markAllAsTouched();
        return;
    }

    const formValue = this.productForm.value;
    const productData: Product = {
        id: this.product()?.id ?? 0,
        name: formValue.name!,
        description: formValue.description!,
        price: formValue.price!,
        categoryId: formValue.categoryId!,
        imageUrl: '', // Add a default or placeholder value
        sustainability_impact: 'Low' // Add a default or placeholder value
    };

    if (this.isEditMode()) {
      this.dataService.updateProduct(productData).subscribe(() => {
        this.router.navigate(['/products', productData.id]);
      });
    } else {
      this.dataService.createProduct(productData).subscribe((newProduct: Product) => {
        this.router.navigate(['/products', newProduct.id]);
      });
    }
  }
}
