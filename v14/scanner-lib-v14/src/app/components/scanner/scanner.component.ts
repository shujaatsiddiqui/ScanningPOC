import { Component, ElementRef, Input, OnChanges, QueryList, SecurityContext, ViewChildren } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AnimationItem } from 'lottie-web';
import { CropperPosition, Dimensions, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { AnimationOptions } from 'ngx-lottie';
import { PageSizes, PDFDocument } from 'pdf-lib';
import DummyImages from "./dummy_images.json";
import { SignalRService } from './services/Signal.RService';
import ScannerLoaderJson from "./animations/scanner-loader.json"

@Component({
  selector: 'img-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss'],
})
export class ScannerComponent implements OnChanges {
  private _imageSrc!: string[];
  private serviceInitialized: boolean = false;

  scanners: { name: string, id: string }[] = [
    { name: 'HP ScanJet Pro 2500', id: 'HP2500' },
    { name: 'Epson WorkForce ES-400', id: 'ES400' },
    { name: 'Canon imageFormula R40', id: 'R40' },
    { name: 'Fujitsu ScanSnap iX1600', id: 'IX1600' },
    { name: 'Brother ADS-2700W', id: 'ADS2700' },
  ];

  isLoading: boolean = false;

  @Input() SERVICE_BASE_URL: string | null = null;

  imgSrcsLocal: string[] = [];

  options: AnimationOptions = {
    animationData:ScannerLoaderJson
  };

  showCropper = true;
  croppedImage: SafeUrl = '';
  croppedImages: any[] = [];
  canvasRotations: number[] = [0, 0, 0, 0];
  editableIndex: number = -1;
  showCroppedPreview = false
  croppedPreviewImages: any[] = []

  // These need to be managed per image in v6.0.2
  imageChangedEvents: (Event | null)[] = [];
  transforms: ImageTransform[] = [];
  
  // Configuration variables
  alignImage = 'center' as const;
  roundCropper = false;
  backgroundColor = 'transparent';
  allowMoveImage = false;
  hideResizeSquares = false;
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
  aspectRatio = 4 / 3;

  // Base transform object - will be used to initialize transforms array
  baseTransform: ImageTransform = {
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

  set imageSrc(value: string[]) {
    console.log("setter called");
    this._imageSrc = value;
    this.imgSrcsLocal = value; // Automatically copy to another variable
    // Initialize transform objects for each image
    this.transforms = value.map(() => ({...this.baseTransform}));
    // Initialize empty events for each image
    this.imageChangedEvents = value.map(() => null);
  }

  get imageSrc(): string[] {
    return this._imageSrc;
  }

  animationCreated(animationItem: AnimationItem): void {
    console.log(animationItem);
  }

  constructor(
    private sanitizer: DomSanitizer, private signalRService: SignalRService
  ) {}

  initializeAndConfigureListener():void{
    if(this.serviceInitialized){
      return
    }

    this.signalRService.initialize(
      this.SERVICE_BASE_URL!,
    );

    this.signalRService.onAttachmentReceive((attachment: Array<string>) => {
      try {
        this.isLoading = false;
        if (Array.isArray(attachment)) {
          this.imageSrc = attachment;
        } else {
          const image = `data:image/jpeg;base64,${attachment}`;
          this.imageSrc.push(image);
        }
      } catch (error) {
        console.error('error occured while receiving attachment', error);
        console.log('using dummy images');
        this.imageSrc = DummyImages;
      }
      finally{
        setTimeout(() => this.initObserver(), 100);
      }
    });
    this.serviceInitialized = true
  }

  ngOnChanges() {
    if (this.imageSrc?.length) {
      setTimeout(() => this.initObserver(), 100); // Small delay to ensure elements are rendered
    }

    if(!this.serviceInitialized){
      this.initializeAndConfigureListener()
    }
  }

  initObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log("asdasdsd : ", entry.target.getAttribute('data-index'));
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
    return this.scanners?.find(scanner => scanner.id === this.toolbarOptions['scanner'])?.name || 'Select Scanner';
  }

  removeImg(index: number) {
    this.imgSrcsLocal = [...this.imgSrcsLocal.slice(0, index), ...this.imgSrcsLocal.splice(index + 1)];
    this.canvasRotations = [...this.canvasRotations.slice(0, index), ...this.canvasRotations.splice(index + 1)];
    this.croppedImages = [...this.croppedImages.slice(0, index), ...this.croppedImages.splice(index + 1)];
    this.transforms = [...this.transforms.slice(0, index), ...this.transforms.splice(index + 1)];
    this.imageChangedEvents = [...this.imageChangedEvents.slice(0, index), ...this.imageChangedEvents.splice(index + 1)];
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
    this.transforms[index] = {...this.baseTransform};
  }

  scanImage() {
    this.isLoading = true;
    setTimeout(() => {
      this.imageSrc = DummyImages;
      
      this.isLoading = false;
      setTimeout(() => this.initObserver(), 100);
    }, 2000);
    this.signalRService.startScanning();
  }

  discard() {
    this.croppedImages = []
    this.croppedImage = ''
    this.showCroppedPreview = false
    this.croppedPreviewImages = []
    this.cropper = []
    this.editableIndex = -1
    this.imageSrc = [];
    this.transforms = [];
    this.imageChangedEvents = [];
  }

  onSave() {
    this.showCroppedPreview = true
    this.editableIndex = -1;
    this.currentIndex = 0;
    setTimeout(() => this.initObserver(), 500);
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

  // Modified for v6.0.2 - work with specific image index
  imageCropped(event: ImageCroppedEvent, index: number) {
    console.log(event)
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.base64!);
    this.croppedImages[index] = this.sanitizer.bypassSecurityTrustUrl(event.base64!);
  }

  // Modified for v6.0.2
  imageLoaded(idx:any) {
    this.showCropper = true;
    console.log('Image loaded');

  }

  cropperReady(sourceImageDimensions: Dimensions) {
    console.log('Cropper ready', sourceImageDimensions);
    // this.loading = false;
  }

  cropperChange(event: any, index: number) {
    console.log("Cropper changed for index " + index, event);
    this.cropper[index] = event;  // Update the specific cropper array index
  }

  loadImageFailed() {
    console.error('Load image failed');
  }

  // Modified to work with transforms array
  transformChange(transform: ImageTransform, index: number) {
    console.log('transform changed', transform);
    this.transforms[index] = {...transform};
  }

  // Modified to work with specific image rotations
  changeRotation(rotation: number) {
    if (this.editableIndex == -1) return
    setTimeout(() => {
      this.canvasRotations[this.editableIndex] = rotation;
    });
  }

  // Modified to work with transforms array
  rotateLeft() {
    if (this.editableIndex === -1) return;
    setTimeout(() => {
      const currentTransform = this.transforms[this.editableIndex];
      currentTransform.rotate = (currentTransform.rotate || 0) - 90;
      this.flipAfterRotate(this.editableIndex);
    });
  }

  // Modified to work with transforms array
  rotateRight() {
    if (this.editableIndex === -1) return;
    setTimeout(() => {
      const currentTransform = this.transforms[this.editableIndex];
      currentTransform.rotate = (currentTransform.rotate || 0) + 90;
      this.flipAfterRotate(this.editableIndex);
    });
  }

  // Modified to work with transforms array
  moveLeft() {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      translateH: (currentTransform.translateH || 0) - 1
    };
  }

  // Modified to work with transforms array
  moveRight() {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      translateH: (currentTransform.translateH || 0) + 1
    };
  }

  // Modified to work with transforms array
  moveDown() {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      translateV: (currentTransform.translateV || 0) + 1
    };
  }

  // Modified to work with transforms array
  moveUp() {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      translateV: (currentTransform.translateV || 0) - 1
    };
  }

  // Modified to work with transforms array
  private flipAfterRotate(index: number) {
    const currentTransform = this.transforms[index];
    const flippedH = currentTransform.flipH;
    const flippedV = currentTransform.flipV;
    this.transforms[index] = {
      ...currentTransform,
      flipH: flippedV,
      flipV: flippedH,
      translateH: 0,
      translateV: 0
    };
  }

  // Modified to work with transforms array
  flipHorizontal() {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      flipH: !currentTransform.flipH
    };
  }

  // Modified to work with transforms array
  flipVertical() {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      flipV: !currentTransform.flipV
    };
  }

  // Modified to reset just the current image
  resetImage() {
    if (this.editableIndex === -1) return;
    this.canvasRotations[this.editableIndex] = 0;
    this.cropper[this.editableIndex] = undefined as any;
    this.transforms[this.editableIndex] = {...this.baseTransform};
  }

  // Modified to work with transforms array
  zoomOut() {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      scale: (currentTransform.scale || 1) - 0.1
    };
  }

  // Modified to work with transforms array
  zoomIn() {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      scale: (currentTransform.scale || 1) + 0.1
    };
  }

  // Modified to work with transforms array
  updateRotation(rotate: number) {
    if (this.editableIndex === -1) return;
    const currentTransform = this.transforms[this.editableIndex];
    this.transforms[this.editableIndex] = {
      ...currentTransform,
      rotate
    };
  }

  toggleAspectRatio() {
    this.aspectRatio = this.aspectRatio === 4 / 3 ? 16 / 5 : 4 / 3;
  }

  toggleBackgroundColor() {
    this.backgroundColor = this.backgroundColor === 'transparent' ? 'transparent' : 'transparent';
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