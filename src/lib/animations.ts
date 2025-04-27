
import anime from 'animejs';

export const fadeInUp = (element: HTMLElement) => {
  return anime({
    targets: element,
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutExpo'
  });
};

export const fadeInRight = (element: HTMLElement) => {
  return anime({
    targets: element,
    translateX: [20, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutExpo'
  });
};

export const fadeInLeft = (element: HTMLElement) => {
  return anime({
    targets: element,
    translateX: [-20, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutExpo'
  });
};

export const staggerFadeIn = (elements: HTMLElement[]) => {
  return anime({
    targets: elements,
    opacity: [0, 1],
    translateY: [20, 0],
    delay: anime.stagger(100),
    duration: 800,
    easing: 'easeOutExpo'
  });
};

export const pulseAnimation = (element: HTMLElement) => {
  return anime({
    targets: element,
    scale: [1, 1.05, 1],
    duration: 1500,
    easing: 'easeInOutQuad',
    loop: true
  });
};

export const shakeAnimation = (element: HTMLElement) => {
  return anime({
    targets: element,
    translateX: [-5, 5, -5, 5, 0],
    duration: 500,
    easing: 'easeInOutSine'
  });
};
