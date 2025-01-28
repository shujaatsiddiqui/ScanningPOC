import { AfterViewInit, Component, ElementRef, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CropperComponent } from 'angular-cropperjs';


@Component({
  selector: 'img-cropper',
  templateUrl: './cropper.component.html',
  styleUrl: './cropper.component.scss'
})
export class ImageCropperComponent implements AfterViewInit {
  @Input() base64Image: string | null = ""; // Ensure this input property exists

  @Input() outputImage: string | null = ""; // Ensure this input property exists
  @Output() outputImageChange = new EventEmitter<string | null>();

  imageUrl: any;
  imageUrls: any[] = [];
  cropperRes: string = "";
  showCropper: boolean = true;
  savedImg: boolean = false;
  resizedBase64: any;
  cropperConfig: object = {
    movable: true,
    scalable: true,
    zoomable: true,
    viewMode: 2,
    checkCrossOrigin: true
  };
  text = '';
  downloadLink = '';
  cropperResults: any = [];
  mergedRes: any;

  @ViewChild('angularCropper') public angularCropper!: CropperComponent;
  @ViewChild("canvasEl") canvasEl!: ElementRef;
  private context!: CanvasRenderingContext2D;

  constructor() {

  }

  ngAfterViewInit() {
    this.context = (this.canvasEl
      .nativeElement as HTMLCanvasElement).getContext("2d")!;
    this.draw('');
  }

  ngOnChanges(changes: any) {
    if (changes.base64Image && this.base64Image) {
      this.imageUrl = this.base64Image;
      this.showCropper = true;
    }
  }

  private draw(src: string) {
    this.context.clearRect(0, 0, (this.canvasEl.nativeElement as HTMLCanvasElement).width, (this.canvasEl.nativeElement as HTMLCanvasElement).height);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const newW = img.width > 700 && img.height > 700 ? img.width / 3 : img.width;
      const newH = img.height > 700 && img.width > 700 ? img.height / 3 : img.height;
      (this.canvasEl.nativeElement as HTMLCanvasElement).width = newW;
      (this.canvasEl.nativeElement as HTMLCanvasElement).height = newH;
      this.context.font = "30px Arial";
      this.context.textBaseline = "middle";
      this.context.textAlign = "center";
      this.context.drawImage(img, 0, 0, newW, newH);
      this.context.fillText(this.text, newW / 2, newH / 2);
      this.downloadLink = this.canvasEl.nativeElement.toDataURL("image/jpg");
      this.cropperResults.push(this.downloadLink);
    }
  }

  onFileSelected(event: any) {
    const that = this;
    if (event.target.files && event.target.files[0]) {
      for (let i = 0; i < event.target.files.length; i++) {
        const reader = new FileReader();
        that.showCropper = false;
        reader.onload = (eventCurr: ProgressEvent) => {
          that.imageUrls.push((<FileReader>eventCurr.target).result);
        };
        reader.readAsDataURL(event.target.files[i]);
      }
    }
  }

  selectImg(i: number) {
    this.refreshCrop(this.imageUrls[i]);
  }

  refreshCrop(img: any) {
    this.imageUrl = img;
    this.showCropper = true;
  }

  cropendImage(event: any) {
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  readyImage(event: any) {
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  rotate(turn: any) {
    turn = turn === 'left' ? -30 : 30;
    this.angularCropper.cropper.rotate(turn);
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  destroy(event: any) {
    this.angularCropper.cropper.destroy();
  }

  zoomManual() {
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  zoom(status: any) {
    status = status === 'positive' ? 0.1 : -0.1;
    this.angularCropper.cropper.zoom(status);
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  move(offsetX: any, offsetY: any) {
    this.angularCropper.cropper.move(offsetX, offsetY);
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  scale(offset: any) {
    if (offset === 'x') {
      this.angularCropper.cropper.scaleX(-1);
    } else {
      this.angularCropper.cropper.scaleY(-1);
    }
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  clear() {
    this.angularCropper.cropper.clear();
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  disable() {
    this.angularCropper.cropper.disable();
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  enable() {
    this.angularCropper.cropper.enable();
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  reset() {
    this.angularCropper.cropper.reset();
    this.cropperRes = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg');
  }

  saveImg() {
    this.savedImg = true;
    this.draw(this.cropperRes);
    this.outputImage = this.cropperRes;
    this.outputImageChange.emit(this.outputImage);
    this.closeModal();

    this.downloadImage(this.cropperRes, 'cropped-image.jpg');
  }

  downloadImage(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openModal() {
    const modal = document.getElementById('cropperModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }

  closeModal() {
    const modal = document.getElementById('cropperModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }

}
