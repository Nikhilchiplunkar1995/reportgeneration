import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-reporting',
  imports: [CommonModule],
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportingComponent {
  private dataService = inject(DataService);

  // File upload signals
  selectedFile = signal<File | null>(null);
  uploadProgress = signal<number | null>(null);
  uploadMessage = signal<string | null>(null);

  // Report download signal
  isDownloading = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile.set(input.files[0]);
      this.uploadMessage.set(null);
      this.uploadProgress.set(null);
    }
  }

  onUpload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.uploadMessage.set('Please select a file first.');
      return;
    }

    this.uploadProgress.set(0);
    this.uploadMessage.set('Uploading...');

    this.dataService.bulkUploadProducts(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const progress = Math.round(100 * (event.loaded / event.total));
            this.uploadProgress.set(progress);
          }
        } else if (event.type === HttpEventType.Response) {
          this.uploadMessage.set('File processing started on the server.');
          setTimeout(() => this.resetUploadState(), 3000); // Reset after a delay
        }
      },
      error: (err) => {
        this.uploadMessage.set('Upload failed. Please try again.');
        console.error(err);
        this.uploadProgress.set(null);
      }
    });
  }

  downloadReport(): void {
    this.isDownloading.set(true);
    this.dataService.downloadProductReport().subscribe({
      next: (blob) => {
        saveAs(blob, 'product-report.xlsx');
        this.isDownloading.set(false);
      },
      error: (err) => {
        console.error('Download failed:', err);
        this.isDownloading.set(false);
      }
    });
  }

  private resetUploadState(): void {
    this.selectedFile.set(null);
    this.uploadProgress.set(null);
    this.uploadMessage.set(null);
  }
}
