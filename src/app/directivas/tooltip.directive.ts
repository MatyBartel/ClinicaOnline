import { Directive, ElementRef, Input, Renderer2, HostListener, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input() appTooltip: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipDelay: number = 500;
  
  private tooltipElement: HTMLElement | null = null;
  private timeoutId: any = null;
  
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}
  
  ngOnInit() {
    this.createTooltip();
  }
  
  ngOnDestroy() {
    this.hideTooltip();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
  
  @HostListener('mouseenter') onMouseEnter() {
    this.showTooltip();
  }
  
  @HostListener('mouseleave') onMouseLeave() {
    this.hideTooltip();
  }
  
  private createTooltip() {
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'custom-tooltip');
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'z-index', '1000');
    this.renderer.setStyle(this.tooltipElement, 'background', '#333');
    this.renderer.setStyle(this.tooltipElement, 'color', 'white');
    this.renderer.setStyle(this.tooltipElement, 'padding', '8px 12px');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'font-size', '12px');
    this.renderer.setStyle(this.tooltipElement, 'max-width', '200px');
    this.renderer.setStyle(this.tooltipElement, 'word-wrap', 'break-word');
    this.renderer.setStyle(this.tooltipElement, 'opacity', '0');
    this.renderer.setStyle(this.tooltipElement, 'transition', 'opacity 0.3s ease');
    this.renderer.setStyle(this.tooltipElement, 'pointer-events', 'none');
    
    this.renderer.appendChild(document.body, this.tooltipElement);
  }
  
  private showTooltip() {
    if (!this.tooltipElement || !this.appTooltip) return;
    
    this.timeoutId = setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.setProperty(this.tooltipElement, 'textContent', this.appTooltip);
        this.renderer.setStyle(this.tooltipElement, 'opacity', '1');
        this.positionTooltip();
      }
    }, this.tooltipDelay);
  }
  
  private hideTooltip() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.tooltipElement) {
      this.renderer.setStyle(this.tooltipElement, 'opacity', '0');
    }
  }
  
  private positionTooltip() {
    if (!this.tooltipElement) return;
    
    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    
    let top: number;
    let left: number;
    
    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + 8;
        break;
      default:
        top = hostRect.top - tooltipRect.height - 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
    }
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 0) left = 8;
    if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width - 8;
    if (top < 0) top = 8;
    if (top + tooltipRect.height > viewportHeight) top = viewportHeight - tooltipRect.height - 8;
    
    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }
} 