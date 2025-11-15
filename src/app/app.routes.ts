import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./home/home').then(m => m.HomeComponent)
    },
    {
        path: 'products',
        loadComponent: () => import('./products/products').then(m => m.ProductsComponent)
    },
    {
        path: 'products/new',
        loadComponent: () => import('./product-form/product-form').then(m => m.ProductFormComponent)
    },
    {
        path: 'products/:id',
        loadComponent: () => import('./product-detail/product-detail').then(m => m.ProductDetailComponent)
    },
    {
        path: 'products/:id/edit',
        loadComponent: () => import('./product-form/product-form').then(m => m.ProductFormComponent)
    },
    {
        path: 'categories',
        loadComponent: () => import('./categories/categories').then(m => m.CategoriesComponent)
    },
    {
        path: 'categories/new',
        loadComponent: () => import('./category-form/category-form').then(m => m.CategoryFormComponent)
    },
    {
        path: 'categories/:id/edit',
        loadComponent: () => import('./category-form/category-form').then(m => m.CategoryFormComponent)
    }
];
