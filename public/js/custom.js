// Mobile Hamburger menu logic

(function ($) {
  "use strict";

  // Close mobile nav on link click
  $('.navbar-collapse a').on('click', function () {
    $(".navbar-collapse").collapse('hide');
  });

  // Smooth scroll for anchor links
  $('.smoothscroll').click(function () {
    var el = $(this).attr('href');
    var elWrapped = $(el);
    var header_height = $('.navbar').height();

    scrollToDiv(elWrapped, header_height);
    return false;

    function scrollToDiv(element, navheight) {
      var offset = element.offset();
      var offsetTop = offset.top;
      var totalScroll = offsetTop - navheight;

      $('body,html').animate({
        scrollTop: totalScroll
      }, 300);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    const currentPath = window.location.pathname;

    /**
     * MOBILE NAV FIX
     */
    const mobileLinks = document.querySelectorAll('.navbar-nav.d-lg-none .nav-link');

    mobileLinks.forEach((link) => {
      link.classList.remove('active');

      const href = link.getAttribute('href');
      if (href && currentPath.startsWith(href)) {
        link.classList.add('active');
      }
    });

    /**
     * DESKTOP NAV FIX
     */
    const desktopLinks = document.querySelectorAll('.nav-links a');

    desktopLinks.forEach((link) => {
      link.classList.remove('active');

      const href = link.getAttribute('href');
      if (href && currentPath.startsWith(href)) {
        link.classList.add('active');
      }
    });
  });

})(window.jQuery);
