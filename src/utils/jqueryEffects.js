import $ from 'jquery';

export const fadeInElement = (element) => {
  if (element) $(element).hide().fadeIn(200);
};

export const smoothScrollToTop = () => {
  $('html, body').animate({ scrollTop: 0 }, 350);
};

export const highlightRow = (element) => {
  if (!element) return;
  $(element).css('background-color', '#dbeafe');
  setTimeout(() => $(element).css('background-color', ''), 900);
};
