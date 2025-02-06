import { AfterViewInit, Component, ElementRef, Input, ViewChild, Output, EventEmitter, SecurityContext, OnChanges, SimpleChanges, ViewChildren, QueryList } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CropperPosition, Dimensions, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { PageSizes, PDFDocument } from 'pdf-lib';
import { AnimationOptions } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'img-cropper',
  templateUrl: './cropper.component.html',
  styleUrl: './cropper.component.scss',
})
export class ImageCropperComponent implements OnChanges {
  private _imageSrc!: string[];

  @Input()
  set imageSrc(value: string[]) {
    console.log("setter called");
    this._imageSrc = value;
    this.imgSrcsLocal = value; // Automatically copy to another variable
  }

  get imageSrc(): string[] {
    return this._imageSrc;
  }

  @Input() scannerOptions: { name: string, id: string }[] | null = null;
  @Input() isLoading: boolean = false;
  @Output() onScan: EventEmitter<{}> = new EventEmitter<{}>();
  @Output() onDiscard: EventEmitter<{}> = new EventEmitter<{}>();
  imgSrcsLocal: string[] = [];
  options: AnimationOptions = {
    path: '/assets/animations/scanner-loader.json',
  };

  animationCreated(animationItem: AnimationItem): void {
    console.log(animationItem);
  }

  showCropper = true;
  // loading = false;
  croppedImage: SafeUrl = '';
  croppedImages: any[] = [];
  canvasRotations: number[] = [0, 0, 0, 0];
  editableIndex: number = -1;
  showCroppedPreview = false
  croppedPreviewImages: any[] = []

  imageChangedEvent: Event | null = null;
  imageURL?: string;
  hidden = false;
  disabled = false;
  alignImage = 'center' as const;
  roundCropper = false;
  backgroundColor = 'red';
  allowMoveImage = false;
  hideResizeSquares = false;
  canvasRotation = 0;
  aspectRatio = 4 / 3;
  containWithinAspectRatio = false;
  maintainAspectRatio = false;
  cropperStaticWidth = 0;
  cropperStaticHeight = 0;
  cropperMinWidth = 0;
  cropperMinHeight = 0;
  cropperMaxWidth = 0;
  cropperMaxHeight = 0;
  resetCropOnAspectRatioChange = true;
  cropper: CropperPosition[] = [];
  transform: ImageTransform = {
    translateUnit: 'px',
    scale: 1,
    rotate: 0,
    flipH: false,
    flipV: false,
    translateH: 0,
    translateV: 0
  };

  timeout: any;
  eventList = {};
  toolbarOptions = {
    scanner: "",
    kind: "Colored",
    resolution: "150 DPI",
    size: "A4"
  }
  currentIndex = 0;

  @ViewChildren('imageRef') imageElements!: QueryList<ElementRef>;

  constructor(
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnChanges() {
    if (this.imageSrc.length) {
      setTimeout(() => this.initObserver(), 100); // Small delay to ensure elements are rendered
    }
  }

  initObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.currentIndex = Number(entry.target.getAttribute('data-index'));
          }
        });
      },
      { threshold: 0.7 } // Image should be at least 70% visible to be considered
    );

    this.imageElements.forEach((image) => {
      observer.observe(image.nativeElement);
    });
  }

  get selectedScannerName(): string {
    return this.scannerOptions?.find(scanner => scanner.id === this.toolbarOptions['scanner'])?.name || 'Select Scanner';
  }

  removeImg(index: number) {
    this.imgSrcsLocal = [...this.imgSrcsLocal.slice(0, index), ...this.imgSrcsLocal.splice(index + 1)];
    this.canvasRotations = [...this.canvasRotations.slice(0, index), ...this.canvasRotations.splice(index + 1)];
    this.croppedImages = [...this.croppedImages.slice(0, index), ...this.croppedImages.splice(index + 1)];
  }

  editImg(index: number) {
    if (this.editableIndex == index) {
      this.editableIndex = -1;
    } else {
      this.editableIndex = index;
    }
    this.showCroppedPreview = false
  }

  undoImage(index: number) {
    this.imgSrcsLocal[index] = this._imageSrc[index]
    this.croppedImages[index] = this._imageSrc[index]
    this.cropper[index] = undefined as any
  }

  scanImage() {
    this.onScan.emit(this.toolbarOptions);
  }

  discard() {
    this.onDiscard.emit(this.toolbarOptions);
    this.croppedImages = []
    this.croppedImage = ''
    this.showCroppedPreview = false
    this.croppedPreviewImages = []
  }

  onSave() {
    this.showCroppedPreview = true
    this.editableIndex = -1
  }


  async onExportPdf() {
    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < this.croppedImages.length; i++) {

        const croppedImage = this.croppedImages[i];
        const imageUrl = this.sanitizer.sanitize(SecurityContext.URL, croppedImage);
        const pageSize: keyof typeof PageSizes = this.toolbarOptions['size'] as keyof typeof PageSizes;
        const page = pdfDoc.addPage(PageSizes[pageSize])

        const img = new Image();
        img.src = imageUrl!;

        await new Promise((resolve) => {
          img.onload = async () => {
            // Create a canvas to convert the image
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);

            // Convert to JPEG format
            const jpegData = canvas.toDataURL('image/jpeg', 1.0);
            const base64Data = jpegData.replace('data:image/jpeg;base64,', '');
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            // Embed the image
            const image = await pdfDoc.embedJpg(imageBytes);
            // Calculate scaling to fit within the selected page with margins
            const pageWidth = page.getSize().width;
            const pageHeight = page.getSize().height;
            const margin = 10; // 10 points margin
            const maxWidth = pageWidth - (2 * margin);
            const maxHeight = pageHeight - (2 * margin);

            const scaleWidth = maxWidth / image.width;
            const scaleHeight = maxHeight / image.height;
            const scale = Math.min(scaleWidth, scaleHeight); // Use the smaller scale to fit both dimensions

            const scaledWidth = image.width * scale;
            const scaledHeight = image.height * scale;

            // Center the image on the page
            const x = (pageWidth - scaledWidth) / 2;
            const y = (pageHeight - scaledHeight) / 2;

            // Draw image on the page
            page.drawImage(image, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });

            resolve(true);
          };
        });
      }
      // Save the PDF
      const pdfBytes = await pdfDoc.save();

      // Create blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `scanned-document-${new Date().toISOString().split('T')[0]}.pdf`
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
    } catch (error) {
      console.error("error while exporting PDF: ", error)
    }

  }


  imageCropped(event: ImageCroppedEvent, index: number) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl || event.base64 || '');
    this.croppedImages[index] = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl || event.base64 || '');
  }

  imageLoaded() {
    this.showCropper = true;
    console.log('Image loaded');
  }

  cropperReady(sourceImageDimensions: Dimensions) {
    console.log('Cropper ready', sourceImageDimensions);
    // this.loading = false;
  }

  loadImageFailed() {
    console.error('Load image failed');
  }

  transformChange(transform: ImageTransform) {
    console.log('transform changed', transform);
  }

  changeRotation(rotation: number) {
    if (this.editableIndex == -1) return
    // this.loading = true;
    // this.toolbarOptions['orientation'] = rotation
    setTimeout(() => { // Use timeout because rotating image is a heavy operation and will block the ui thread
      this.canvasRotation = rotation;
      this.canvasRotations[this.editableIndex] = rotation;
      // this.flipAfterRotate();
    });
  }

  rotateLeft() {
    // this.loading = true;
    setTimeout(() => { // Use timeout because rotating image is a heavy operation and will block the ui thread
      this.canvasRotation--;
      this.flipAfterRotate();
    });
  }

  rotateRight() {
    // this.loading = true;
    setTimeout(() => {
      this.canvasRotation++;
      this.flipAfterRotate();
    });
  }

  moveLeft() {
    this.transform = {
      ...this.transform,
      translateH: this.transform.translateH! - 1
    };
  }

  moveRight() {
    this.transform = {
      ...this.transform,
      translateH: this.transform.translateH! + 1
    };
  }

  moveDown() {
    this.transform = {
      ...this.transform,
      translateV: this.transform.translateV! + 1
    };
  }

  moveUp() {
    this.transform = {
      ...this.transform,
      translateV: this.transform.translateV! - 1
    };
  }

  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH,
      translateH: 0,
      translateV: 0
    };
  }

  flipHorizontal() {
    this.transform = {
      ...this.transform,
      flipH: !this.transform.flipH
    };
  }

  flipVertical() {
    this.transform = {
      ...this.transform,
      flipV: !this.transform.flipV
    };
  }

  resetImage() {
    this.imageElements.get(0)?.nativeElement
    this.canvasRotation = 0;
    this.cropper = [];
    this.maintainAspectRatio = false;
    this.transform = {
      translateUnit: 'px',
      scale: 1,
      rotate: 0,
      flipH: false,
      flipV: false,
      translateH: 0,
      translateV: 0
    };
  }

  zoomOut() {
    this.transform = {
      ...this.transform,
      scale: this.transform.scale! - .1
    };
  }

  zoomIn() {
    this.transform = {
      ...this.transform,
      scale: this.transform.scale! + .1
    };
  }

  updateRotation(rotate: number) {
    this.transform = {
      ...this.transform,
      rotate
    };
  }

  toggleAspectRatio() {
    this.aspectRatio = this.aspectRatio === 4 / 3 ? 16 / 5 : 4 / 3;
  }

  toggleBackgroundColor() {
    this.backgroundColor = this.backgroundColor === 'red' ? 'blue' : 'red';
  }

  // prevent over triggering app when typing
  debounce(event: any) {
    clearTimeout(this.timeout);
    (this.eventList as any)[event.target!.id] = event.target.value;
    this.timeout = setTimeout(() => {
      for (const [key, value] of Object.entries(this.eventList)) {
        (this as any)[key] = Number(value);
      }
      this.eventList = {};
    }, 500);
  }


}
