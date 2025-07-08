import { Directive, ElementRef, Input, Renderer2, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appLoading]',
  standalone: true
})
export class LoadingDirective implements OnInit, OnDestroy {
  @Input() appLoading: boolean = false;
  @Input() loadingText: string = 'Cargando...';
  @Input() loadingSpinner: boolean = true;
  
  private originalContent: string = '';
  private loadingElement: HTMLElement | null = null;
  
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}
  
  ngOnInit() {
    this.originalContent = this.el.nativeElement.innerHTML;
    this.createLoadingElement();
    this.updateLoadingState();
  }
  
  ngOnDestroy() {
    if (this.loadingElement) {
      this.renderer.removeChild(this.el.nativeElement, this.loadingElement);
    }
  }
  
  private createLoadingElement() {
    this.loadingElement = this.renderer.createElement('div');
    this.renderer.addClass(this.loadingElement, 'loading-overlay');
    
    if (this.loadingSpinner) {
      const spinner = this.renderer.createElement('div');
      this.renderer.addClass(spinner, 'loading-spinner');
      this.renderer.appendChild(this.loadingElement, spinner);
    }
    
    if (this.loadingText) {
      const text = this.renderer.createElement('span');
      this.renderer.addClass(text, 'loading-text');
      this.renderer.setProperty(text, 'textContent', this.loadingText);
      this.renderer.appendChild(this.loadingElement, text);
    }
    
    this.renderer.appendChild(this.el.nativeElement, this.loadingElement);
  }
  
  private updateLoadingState() {
    if (this.appLoading) {
      this.renderer.addClass(this.el.nativeElement, 'loading');
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
      this.renderer.setStyle(this.el.nativeElement, 'pointer-events', 'none');
      
      if (this.loadingElement) {
        this.renderer.setStyle(this.loadingElement, 'display', 'flex');
      }
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'loading');
      this.renderer.setStyle(this.el.nativeElement, 'pointer-events', 'auto');
      
      if (this.loadingElement) {
        this.renderer.setStyle(this.loadingElement, 'display', 'none');
      }
    }
  }
  
  // Método público para actualizar el estado de carga
  setLoading(loading: boolean) {
    this.appLoading = loading;
    this.updateLoadingState();
  }
} 