import { load, type CheerioAPI } from 'cheerio';
import home from '../templates/index.html?raw';
import about from '../templates/about.html?raw';
import serviceIndex from '../templates/services.html?raw';
import service from '../templates/services-single.html?raw';
import blog from '../templates/blog.html?raw';
import article from '../templates/blog-single.html?raw';
import gallery from '../templates/gallery.html?raw';
import contact from '../templates/contact-us.html?raw';
import pricing from '../templates/pricing.html?raw';
import { pages, posts, services, site, dateLabel, type Entry } from './site';
import { plans } from './crm';
export { plans };

const templates = { home, about, serviceIndex, service, blog, article, gallery, contact, pricing };
type TemplateName = keyof typeof templates;
type Options = { type: TemplateName; title: string; entry?: Entry; items?: Entry[]; blogPage?: number; totalBlogPages?: number };
const routeMap: Record<string, string> = {
  'index.html': '/', 'about.html': '/about-us/', 'services.html': '/our-services/',
  'blog.html': '/blog/', 'gallery.html': '/our-work/', 'contact-us.html': '/contact-us/',
  'pricing.html': '/memberships/', 'appointment.html': '/contact-us/',
};
const homeContent = load(pages.find(page => page.path === '/')!.html);
const homeText = homeContent('p,h2,h3,h4,h5,h6').toArray().map(node => homeContent(node).text().trim());
const reviews = ['Gina W.', 'Grace C.'].map(name => ({ name, quote: (homeText[homeText.indexOf(name) - 1] || '').replace(/\s+/g, ' ').trim() }));
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

function hideSection($: CheerioAPI, selector: string) {
  $(selector).each((_, node) => {
    const section = $(node).parents().filter((_, ancestor) => $(ancestor).parent().is('body')).first();
    const target = section.length ? section : $(node);
    target.attr('hidden', '');
    if (/ak-height/.test(target.prev().attr('class') || '')) target.prev().attr('hidden', '');
  });
}

function applyBrand($: CheerioAPI) {
  $('script, #preloader').remove();
  $('.ak-site_branding').attr('href', '/').attr('aria-label', site.name);
  $('.ak-site_branding img').attr({ src: '/brand/logo-header.svg', alt: site.name, width: '142', height: '75' });
  $('.footer-logo img').attr({ src: '/brand/logo-footer.svg', alt: site.name, width: '220', height: '117' });
  const nav = $('.ak-nav_list');
  nav.html(`<li><a class="text-hover-animaiton" href="/">Home</a></li>
    <li><a class="text-hover-animaiton" href="/about-us/">About</a></li>
    <li class="menu-item-has-children"><a class="text-hover-animaiton" href="/our-services/">Services</a><ul>${services.map(item => `<li><a class="text-hover-animaiton" href="${item.path}">${escape(item.name)}</a></li>`).join('')}<li><a href="/service-areas/">Service Areas</a></li></ul></li>
    <li><a class="text-hover-animaiton" href="/our-work/">Our Work</a></li>
    <li><a class="text-hover-animaiton" href="/blog/">Blog</a></li>
    <li><a class="text-hover-animaiton" href="/memberships/">Memberships</a></li>
    <li><a class="text-hover-animaiton" href="/contact-us/">Contact</a></li>`);
  $('.ak-main-header-right a, .footer-info a[href^="tel:"]').attr('href', site.tel);
  $('.ak-main-header-right h6, .footer-info .phone').text(site.phone);
  $('.footer-info .desp').text('Family owned. Fine tuned. Collision repair, mechanical repair, smog checks, tires and alignment in Pasadena, California.');
  $('.footer-email .background-text').text('Contact');
  $('.footer-email .email-title').text('Get in touch with Gabriel’s Auto Service for your next repair or maintenance visit.');
  $('.footer-email form').replaceWith(`<a class="common-btn" href="/contact-us/">Get a quote</a>`);
  $('.footer-menu-one .footer-menu').html('<p class="menu-title">QUICK LINKS</p>' + [['About Us','/about-us/'],['Our Services','/our-services/'],['Our Work','/our-work/'],['Contact Us','/contact-us/']].map(([label,path]) => `<a class="menu-item text-hover-animaiton white" href="${path}">${label}</a>`).join(''));
  $('.footer-menu-two .footer-menu').html('<p class="menu-title">EXPLORE</p>' + [['Service Areas','/service-areas/'],['Blog / News','/blog/'],['Memberships','/memberships/']].map(([label,path]) => `<a class="menu-item text-hover-animaiton white" href="${path}">${label}</a>`).join(''));
  $('.footer-address .location').attr('href', site.directions).text(site.address);
  $('.footer-address .email').attr('href', `mailto:${site.email}`).text(site.email);
  $('.footer-address .date').html('Mon–Fri: 8 AM–5 PM<br>Sat: 8 AM–1 PM<br>Sun: Closed');
  $('footer .title.text-hover-animaiton').text(`© ${new Date().getFullYear()} ${site.name}`);
  $('.social-hero, footer .social-icon').attr('hidden', '');
  $('.cta-title').text('Get in touch with our experts');
  $('.cta-desp').text('Call Gabriel’s Auto Service for an estimate or visit our shop at 250 North Hill Avenue in Pasadena. We offer quality auto repairs backed by years of experience.');
  $('.cta-btn').attr('href', site.tel);
  $('.cta-btn span').text(site.phone);
  hideSection($, '.team-contant');
  hideSection($, '.ak-trusted-client-slider');
  hideSection($, '.video-home');
  hideSection($, '.ak-accordion');
  $('a[href*="team"], a[href*="faq.html"], a[href*="comming.html"]').attr('hidden','');
}

function features($: CheerioAPI) {
  $('.choose-us-info .ak-section-subtitle').text('Gabriel’s Auto Service is a family-owned and operated business with over 30 years of experience. Our skilled technicians handle collision repairs, mechanical services, smog checks, tires and alignment.');
  const highlights = ['ASE Certified Technicians', 'Comprehensive Auto Repairs', 'AAA Approved Shop', 'Warranty Protected'];
  $('.stroke-heading-text h3').each((i, node) => $(node).text(highlights[i % highlights.length]));
  $('.choose-us-info .common-btn').attr('href','/about-us/');
  $('.choose-us-img img').not('.circle-img').attr({
    src: '/media/Gabriels-auto-service-26-scaled-33cf12afd24c.jpg',
    alt: 'Technician inspecting a vehicle at Gabriel’s Auto Service in Pasadena',
  });
  $('.choose-us-img .circle-img').remove();
  const counters = [{number:'30',label:'YEARS OF EXPERIENCE'}, {number:'4',label:'CORE AUTO SERVICES'}, {number:'23',label:'COMMUNITIES SERVED'}];
  $('.ak-funfact').each((index, node) => {
    const item = counters[index % 3];
    $(node).find('.counter').attr('data-number', item.number).text('0');
    $(node).find('.ak-funfact-text p').text(item.label);
    if (index % 3 !== 0) $(node).find('.ak-funfact-number > div').eq(1).attr('hidden','');
  });
  const reviewThumbs = [
    '/media/Gabriels-auto-service-34-3fa175576902.jpg',
    '/media/Gabriels-auto-service-36-b77c7b8f5919.jpg',
  ];
  $('.testimonal-info').each((i, node) => {
    const review = reviews[i % reviews.length];
    $(node).find('.name').text(review.name);
    $(node).find('.from').text('Yelp Review');
    $(node).find('.desp').text(review.quote);
    $(node).find('.testimaonial-slide-img').attr({
      src: reviewThumbs[i % reviewThumbs.length],
      alt: 'Gabriel’s Auto Service in Pasadena',
    });
  });
  $('.testimonal-img img').attr({
    src: '/media/Gabriels-auto-service-38-1d271a9bdb5a.jpg',
    alt: 'BMW serviced at Gabriel’s Auto Service in Pasadena',
  });
}

function serviceCards($: CheerioAPI) {
  const container = $('.service').first();
  const card = container.find('.service-card').first().clone();
  container.empty();
  services.forEach((item) => {
    const node = card.clone();
    node.find('a').attr('href', item.path);
    node.find('.card-title').text(item.name);
    node.find('.card-desp').text(item.copy);
    node.find('img').attr({src: item.image, alt: `${item.name} at Gabriel’s Auto Service`});
    container.append(node);
  });
  $('.services-content .ak-section-subtitle').text('Collision repair, mechanical maintenance, smog checks and tire services. Explore the care available at our Pasadena shop.');
  $('.services-content .more-btn').attr('href','/our-services/');
}

function pricingCards($: CheerioAPI) {
  $('.pricing-card').each((i, node) => {
    const plan = plans[i % plans.length];
    if (i >= plans.length) { $(node).closest('.swiper-slide').remove(); if ($(node).parent().length) $(node).remove(); return; }
    const card = $(node);
    card.find('.pricing-heading .title').text(plan.name);
    card.find('.discount-price').text(`$${plan.price}`);
    card.find('.main-price').text(`/ ${plan.interval}`);
    card.find('.opation .title').each((j, option) => $(option).text(plan.benefits[j % plan.benefits.length]));
    card.find('.get-started-btn').attr({
      href: '#enrollment',
      'data-plan-id': plan.id,
      'data-plan': plan.name,
      'data-price': String(plan.price),
      'data-interval': plan.interval,
      'data-checkout-url': plan.checkoutUrl,
      'aria-haspopup': 'dialog',
    });
  });
  const area = $('.prices-table-wapper').length ? $('.prices-table-wapper') : $('.pricing').first().closest('.container');
  $('.prices-table-wapper').attr('data-src', '/media/Gabriels-auto-service-46-4771f254fdcf.jpg');
  area.find('.background-text').text('Memberships');
  area.find('.ak-section-title').text('Memberships');
  area.find('.ak-section-subtitle').text('Choose a monthly auto care membership to keep your vehicle maintained year-round with predictable pricing and priority service.');
}

function blogCards($: CheerioAPI, items: Entry[]) {
  const first = $('.blog-card').first();
  if (!first.length) return;
  const wrapper = first.closest('.col').length ? first.closest('.col') : first;
  const parent = wrapper.parent();
  const shell = wrapper.clone();
  parent.empty();
  for (const post of items) {
    const node = shell.clone();
    node.find('a').attr('href',post.path);
    node.find('.blog-title').text(post.title);
    node.find('.blog-text').text(dateLabel(post.date));
    node.find('.blog-header-info img').attr({src:post.image?.src || '/media/Gabriels-auto-service-36-b77c7b8f5919.jpg',alt:post.image?.alt || '',loading:'lazy'});
    parent.append(node);
  }
  parent.closest('.container').find('.ak-section-subtitle').text('Auto maintenance tips and repair information for drivers in Pasadena and the surrounding communities.');
}

function contentHTML(entry: Entry) {
  const $ = load(entry.html, {}, false);
  $('img').attr('loading','lazy');
  $('a[href="#contact"]').attr('href','/contact-us/');
  $('h1,h2,h3,h4').addClass('single-blog-title');
  $('p').addClass('single-blog-desp');
  return `<div class="wp-content" data-aos="fade-up">${$.root().html()}</div>`;
}

function serviceDetail($: CheerioAPI, entry: Entry) {
  const source = load(entry.html, {}, false);
  const paragraphs = source('p').toArray().map(node => source(node).text().replace(/\s+/g, ' ').trim().replaceAll('Gabriel;s', 'Gabriel’s')).filter(text => text.length > 25);
  const blocks = $('.sticky-content > .content .single-blog-list');
  const core = services.some(item => item.path === entry.path);
  const city = entry.path.startsWith('/auto-repair-shop-');

  if (entry.path === '/service-areas/') {
    const cities = pages.filter(page => page.path.startsWith('/auto-repair-shop-'));
    blocks.first().find('.single-blog-title').text('Auto Repair Service Areas');
    blocks.first().find('.single-blog-desp').text('Visit Gabriel’s Auto Service in Pasadena for professional auto repair, maintenance, smog checks and collision repair. We welcome drivers from across the San Gabriel Valley and greater Los Angeles area.');
    blocks.first().find('img').attr({
      src: '/media/Gabriels-auto-service-35-15a150657691.jpg',
      alt: 'Gabriel’s Auto Service shop in Pasadena',
    });
    blocks.slice(1).remove();
    $('.sticky-content > .content').append(`<div class="single-blog-list" data-aos="fade-up"><h4 class="single-blog-title">Cities We Serve</h4><p class="single-blog-desp">Select your city to learn more about the services available at our Pasadena shop.</p><div class="service-area-links">${cities.map(page => `<a class="more-btn" href="${page.path}">${escape(page.title.replace(/^Auto Repair Shop (?:in|for) /, ''))}</a>`).join('')}</div></div>`);
    $('.next-prev-btn').attr('hidden', '');
  } else {
    const servicePhotos: Record<string, [string, string, string]> = {
      '/collision-repair-services/': [
        '/media/Gabriels-auto-service-37-b0ae75f2b841.jpg',
        '/media/Gabriels-auto-service-34-3fa175576902.jpg',
        '/media/Gabriels-auto-service-36-b77c7b8f5919.jpg',
      ],
      '/mechanical-repair-services/': [
        '/media/Gabriels-auto-service-33-7d18eba784aa.jpg',
        '/media/Gabriels-auto-service-46-4771f254fdcf.jpg',
        '/media/Gabriels-auto-service-38-1d271a9bdb5a.jpg',
      ],
      '/smog-checks/': [
        '/media/Gabriels-auto-service-35-15a150657691.jpg',
        '/media/Gabriels-auto-service-40-0ad9808ef123.jpg',
        '/media/Gabriels-auto-service-34-3fa175576902.jpg',
      ],
      '/tires-alignment/': [
        '/media/Gabriels-auto-service-44-0679ba3dd1c8.jpg',
        '/media/Gabriels-auto-service-45-f6d6776bdaa6.jpg',
        '/media/Gabriels-auto-service-38-1d271a9bdb5a.jpg',
      ],
    };
    const [heroPhoto, detailPhoto1, detailPhoto2] = servicePhotos[entry.path] || [
      '/media/Gabriels-auto-service-34-3fa175576902.jpg',
      '/media/Gabriels-auto-service-36-b77c7b8f5919.jpg',
      '/media/Gabriels-auto-service-33-7d18eba784aa.jpg',
    ];
    const cityParagraphs = paragraphs.filter(text => text.length > 115 && !text.startsWith('Gabriel’s Auto Service provides') && !text.startsWith('Our process is streamlined') && !text.startsWith('With my repairs') && !text.startsWith('They are honest') && !text.startsWith('Phone:') && !text.includes('Hours: Mon–Fri'));
    const copy = core ? paragraphs : cityParagraphs;
    const grouped: Record<string, { headings: string[]; indexes: number[][] }> = {
      '/collision-repair-services/': { headings: ['Collision Repair Services', 'Experienced Collision Repairs', 'Our Repair Process', 'Tow & Estimates', 'Quality Repairs & Pickup'], indexes: [[0], [1], [2], [3,4], [5,6]] },
      '/mechanical-repair-services/': { headings: ['Mechanical Repair Services', 'Precision Mechanical Repairs', 'Our Repair Process', 'Tow & Estimates', 'Quality Repairs & Pickup'], indexes: [[0], [1], [2], [3,4], [5,6]] },
      '/smog-checks/': { headings: ['Smog Check Services', 'Reliable Emissions Inspections', 'AAA Approved Shop', 'Regular & STAR Smog Checks', 'Our Service Process'], indexes: [[0], [1], [2], [3], [4]] },
      '/tires-alignment/': { headings: ['Tires & Alignment Services', 'Precision Alignment and Tire Care', 'Our Service Process', 'AAA Approved Shop', 'Quality Repairs & Pickup'], indexes: [[0], [1], [2], [7], [5,6]] },
    };
    const plan = grouped[entry.path];
    const cityHeading = (text: string) => {
      if (/brake/i.test(text)) return 'Brake Repair';
      if (/collision|bodywork/i.test(text)) return 'Collision Repair';
      if (/air conditioning|heating|electrical|comfort/i.test(text)) return 'Diagnostics & Comfort';
      if (/find us|located|our shop is at|visit our shop/i.test(text)) return 'Visit Our Pasadena Shop';
      if (/trust|choose|depend|reliable/i.test(text)) return 'Why Drivers Choose Gabriel’s';
      if (/schedule|appointment|estimate/i.test(text)) return 'Plan Your Visit';
      return 'Complete Auto Repair';
    };
    const headings = plan?.headings || [entry.title, ...cityParagraphs.slice(1, 5).map(cityHeading)];
    const indexes = plan?.indexes || [[0], [1], [2], [3], [4]];
    blocks.each((i, node) => {
      const block = $(node);
      const text = indexes[i].map(index => copy[index]).filter(Boolean).join(' ');
      block.find('.single-blog-title').first().text(headings[i] || 'Plan Your Visit');
      block.find('.single-blog-desp').first().text(text || (i === 0 ? entry.excerpt : `Call ${site.phone} or visit our shop at ${site.address} to discuss your vehicle.`));
    });
    blocks.first().find('img').attr({ src: heroPhoto, alt: `${entry.title} at Gabriel’s Auto Service`, loading: 'lazy' });
    blocks.eq(3).find('img').eq(0).attr({ src: detailPhoto1, alt: 'Vehicle repair work at Gabriel’s Auto Service', loading: 'lazy' });
    blocks.eq(3).find('img').eq(1).attr({ src: detailPhoto2, alt: 'Vehicle serviced at Gabriel’s Auto Service', loading: 'lazy' });

    const sequence = core ? services : city ? pages.filter(page => page.path.startsWith('/auto-repair-shop-')) : [];
    const index = sequence.findIndex(item => item.path === entry.path);
    if (index >= 0) {
      const previous = sequence[(index - 1 + sequence.length) % sequence.length];
      const next = sequence[(index + 1) % sequence.length];
      $('.next-prev-btn .prev-btn').replaceWith(`<a class="prev-btn button" href="${previous.path}" aria-label="Previous service"><img src="/cras/img/prev.svg" alt=""><span>prev</span></a>`);
      $('.next-prev-btn .next-btn').replaceWith(`<a class="next-btn button" href="${next.path}" aria-label="Next service"><span>next</span><img src="/cras/img/next.svg" alt=""></a>`);
    }
  }

  if (city) {
    const questions = source('h3,h4').toArray().filter(node => /\?$/.test(source(node).text().trim())).map(node => {
      let next = source(node).next();
      while (next.length && !/^h[2-4]$/i.test(next[0].tagName)) {
        const answer = next.is('p') ? next.text().replace(/\s+/g, ' ').trim() : '';
        if (answer) return { question: source(node).text().trim(), answer };
        next = next.next();
      }
      return null;
    }).filter((item): item is {question: string; answer: string} => Boolean(item)).slice(0, 5);
    if (questions.length) {
      const accordion = $('.ak-accordion').first();
      const shell = accordion.find('.ak-accordion-item').first().clone();
      const section = accordion.parents().filter((_, node) => $(node).parent().is('body')).first();
      section.removeAttr('hidden');
      section.prev().removeAttr('hidden');
      const contactRows = section.find('.images-info > .d-flex');
      contactRows.eq(0).find('a').attr('href', site.tel);
      contactRows.eq(0).find('h3').text(site.phone);
      contactRows.eq(1).find('a').attr('href', `mailto:${site.email}`);
      contactRows.eq(1).find('h3').text(site.email);
      section.find('.img-bg-faq').attr({
        src: '/media/Gabriels-auto-service-41-d76dbee51ce1.jpg',
        alt: 'Gabriel’s Auto Service bays in Pasadena',
      });
      section.find('.ak-location a').attr('href', site.directions).find('span').last().text(site.address);
      section.find('.ak-date-time a').attr('href', '/contact-us/').find('span').last().html('Mon–Fri: 8 AM–5 PM<br>Sat: 8 AM–1 PM');
      accordion.empty();
      questions.forEach(({ question, answer }, i) => {
        const item = shell.clone();
        item.find('.ak-accordion-title h6').text(question);
        item.find('.ak-accordion-tab').text(answer);
        item.find('.ak-accordion-title').toggleClass('active', i === 0);
        accordion.append(item);
      });
    }
  }

  const related = services.filter(item => item.path !== entry.path).slice(0, 3);
  $('.sticky-content > .sidebar .service-card-style-2').each((i, node) => {
    const item = related[i];
    if (!item) { $(node).remove(); return; }
    $(node).find('a').attr('href', item.path);
    $(node).find('.title').text(item.name);
    $(node).find('.desp').text(item.copy);
  });
  $('.common-page-title a').text(city ? 'Service Areas' : core ? 'Services' : entry.title).attr('href', city ? '/service-areas/' : core ? '/our-services/' : entry.path);
}

function homePage($: CheerioAPI) {
  const slides = [
    ['Gabriel’s Auto','Service','Family owned. Fine tuned. We offer quality auto repairs backed by years of experience. Collision repair, mechanical services, smog checks, tires and alignment.','/media/Gabriels-auto-service-34-3fa175576902.jpg'],
    ['Mechanical','Repairs','From scheduled maintenance and computer diagnostics to brakes, air conditioning and electrical repairs. Visit our experienced technicians in Pasadena.','/media/Gabriels-auto-service-36-b77c7b8f5919.jpg'],
    ['Collision','Repair','Quality collision repairs, bodywork and paint services from the specialists at Gabriel’s Auto Service.','/media/Gabriels-auto-service-35-15a150657691.jpg'],
    ['Smog Checks','& Tire Service','Regular and STAR smog checks, tires and alignment. Call our Pasadena shop to arrange your next visit.','/media/Gabriels-auto-service-38-1d271a9bdb5a.jpg'],
  ];
  $('.ak-slider-hero-1 .swiper-slide').each((i,node) => {
    const [title,second,description,photo] = slides[i % slides.length];
    $(node).find('.ak-hero-bg').attr({ src: photo, alt: `${title} ${second} at Gabriel’s Auto Service` });
    $(node).find('.hero-main-title').text(title);
    $(node).find('.hero-main-title-1').text(second);
    $(node).find('.mini-title').text(description);
    $(node).find('.common-btn').text('GET A QUOTE').attr('href','/contact-us/');
  });
  const intro = [services[1],services[0],{name:'Smog, Tires & Alignment',path:'/our-services/',copy:'Regular and STAR smog checks, tire services and alignment in Pasadena.'}];
  $('.service-progress-card').each((i,node) => {
    $(node).find('.title').text(intro[i].name);
    $(node).find('.desp').text(intro[i].copy);
    $(node).find('a').attr('href',intro[i].path).attr('aria-label',intro[i].name);
  });
  features($);
  serviceCards($);
  pricingCards($);
  blogCards($, posts.slice(0,3));
}

function innerPage($: CheerioAPI, options: Options) {
  const {type,entry,items = posts,title} = options;
  $('.common-page-title .page-title, .contact-form-title').text(title);
  $('.common-page-title a').text(type === 'article' ? 'Blog' : title).attr('href', type === 'article' ? '/blog/' : entry?.path || '/memberships/');
  $('.common-page-title .slider-control').attr('hidden','');
  if (type === 'article') $('.next-prev-btn').attr('hidden','');
  if (type === 'serviceIndex') serviceCards($);
  if (type === 'service' && entry) {
    serviceDetail($, entry);
  }
  if (type === 'service' && !entry) {
    $('.sticky-content > .content').html('<div class="wp-content"><h1>Page not found</h1><p>We could not find this page. Explore our services or return to the home page.</p><p><a class="common-btn" href="/">Back to home</a></p></div>');
    $('.sticky-content > .sidebar').attr('hidden', '');
  }
  if (type === 'about' && entry) {
    features($);
    $('[data-src*="about-page-title"]').attr('data-src', '/media/Gabriels-auto-service-35-15a150657691.jpg');
    $('.choose-us-info .common-btn').attr('href', '/contact-us/');
    $('.tabs li').each((i,node) => $(node).text(['About Us','Experience','Services'][i]));
    $('.tabs-content .background-text').text('Gabriel’s');
    const copy = [
      'Gabriel’s Auto Services is a family-owned and operated auto service business with over 30 years of experience in the industry.',
      'Our dedicated team of skilled repair specialists, painters and estimators is committed to providing exceptional service, treating every vehicle as if it were our own.',
      'Our technicians handle collision and mechanical repairs, smog checks, tire services and more at our fully equipped body shop in Pasadena.',
    ];
    $('.tabs-content .desp').each((i,node) => $(node).text(copy[i]));
    pricingCards($);
    const teamSection = $('.team-contant').parents().filter((_, node) => $(node).parent().is('body')).first();
    teamSection.prev().removeAttr('hidden');
  }
  if (type === 'gallery' && entry) {
    const container = $('#static-thumbnails');
    const card = container.children().first().clone();
    container.empty();
    entry.gallery.forEach((src,i) => {
      const item = card.clone();
      item.find('a').attr('href',src).attr('aria-label',`Open workshop photo ${i+1}`);
      item.find('img').first().attr({src,alt:`Gabriel’s Auto Service workshop photo ${i+1}`,loading:'lazy'});
      container.append(item);
    });
  }
  if (type === 'blog') {
    const first = items[0];
    if (first) {
      $('.blog-feature .data').text(dateLabel(first.date));
      $('.blog-feature .title').text(first.title);
      $('.blog-feature .desp').text(first.excerpt);
      $('.blog-feature a').attr('href',first.path);
      $('.blog-feature img').attr({src:first.image?.src || '/media/Gabriels-auto-service-36-b77c7b8f5919.jpg',alt:first.image?.alt || ''});
    }
    blogCards($, items);
    if (options.blogPage && (options.totalBlogPages || 0) > 1) {
      $('.blog-card').last().closest('.container').append(`<nav class="gabriel-pagination" aria-label="Blog pages">${Array.from({length:options.totalBlogPages!},(_,i)=>`<a class="more-btn" href="${i ? `/blog/page/${i+1}/` : '/blog/'}" ${options.blogPage === i+1 ? 'aria-current="page"' : ''}>${i+1}</a>`).join('')}</nav>`);
    }
  }
  if (type === 'article' && entry) {
    $('.container-customize').html(`<div class="time-title" data-aos="fade-up"><p class="time">${dateLabel(entry.date)}</p><h1 class="title">${escape(entry.title)}</h1><div class="ak-height-50 ak-height-lg-30"></div></div>${contentHTML(entry)}`);
    $('.common-page-title .page-title').text('Blog');
    blogCards($,posts.filter(post=>post.path!==entry.path).slice(0,3));
  }
  if (type === 'contact') {
    $('.contact-form > div > p').text('Call, message us, or visit our shop in Pasadena. Send your vehicle details below and our team will follow up promptly.');
    $('#contact-form').attr('id', 'inquiry-form').removeAttr('method');
    $('#inquiry-form label[for="topic"]').text('Phone Number*').attr('for', 'phone');
    $('#inquiry-form #topic').attr({ id: 'phone', name: 'phone', type: 'tel', placeholder: '(626) 555-0199', autocomplete: 'tel' });
    $('#inquiry-form label[for="subject"]').text('Service / Interest*').attr('for', 'interest');
    $('#inquiry-form #subject').attr({ id: 'interest', name: 'interest', placeholder: 'e.g. Oil Change, Repair, Membership' });
    $('#inquiry-form .from-textarea').after(`
      <div class="crm-consent-row">
        <label class="crm-checkbox-label">
          <input type="checkbox" name="sms_opt_in" value="Yes" checked />
          <span>I agree to receive SMS appointment reminders and service updates from Gabriel’s Auto Service. Reply STOP to opt out.</span>
        </label>
      </div>
    `);
    $('#submit').attr('id', 'submit-inquiry').text('SEND MESSAGE');
    $('.contact-info .ak-section-subtitle').text('Family owned. Fine tuned. Auto service and repair at 250 North Hill Avenue in Pasadena, California.');
    const info = [[site.email],[site.address],[site.phone],['Monday–Friday: 8 AM–5 PM','Saturday: 8 AM–1 PM','Sunday: Closed']];
    $('.info-card').each((i,node)=>$(node).find('.d-flex > div').last().html(info[i].map(line=>`<p>${escape(line)}</p>`).join('')));
    $('iframe').attr('src','https://maps.google.com/maps?q=250%20North%20Hill%20Avenue%20Pasadena%20CA%2091106&output=embed').attr('title','Gabriel’s Auto Service location').attr('loading','lazy');
  }
  if (type === 'pricing') {
    pricingCards($);
    $('.pricing').find('.pricing-card').each((i,node)=>{
      if (i >= plans.length) $(node).remove();
    });
    $('.container').filter((_,node)=>$(node).find('form').length>0 && !$(node).closest('footer').length).attr('hidden','');
  }
}

export function renderTemplate(options: Options) {
  const $ = load(templates[options.type]);
  applyBrand($);
  if (options.type === 'home') homePage($);
  else innerPage($,options);
  $('.hero-contact-info').each((_,node) => {
    const links = $(node).find('a');
    links.eq(0).attr('href',`mailto:${site.email}`).find('p').first().text(site.email);
    links.eq(1).attr('href',site.directions).find('p').first().text(site.address);
    $(node).find('p').filter((_,paragraph)=>/Sun\s*-\s*Thu/.test($(paragraph).text())).text('Mon–Fri: 8 AM–5 PM · Sat: 8 AM–1 PM');
  });
  $('[src], [data-src], [href]').each((_, node) => {
    const element = $(node);
    for (const attribute of ['src','data-src','href']) {
      const value = element.attr(attribute);
      if (!value) continue;
      if (/^assets\//.test(value)) element.attr(attribute, value.replace(/^assets\/+/, '/cras/').replaceAll('//','/'));
      else if (attribute === 'href') {
        const file = value.replace(/^\//,'');
        if (routeMap[file]) element.attr(attribute,routeMap[file]);
        else if (/\.html(?:#.*)?$/.test(file)) element.attr('hidden','');
      }
    }
    if (node.tagName === 'img' && /^(\.\.\.?|Phto)$/.test(element.attr('alt') || '')) element.attr('alt','');
  });
  return $('body').html() || '';
}
