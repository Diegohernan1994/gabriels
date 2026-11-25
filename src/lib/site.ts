import wordpress from '../data/wordpress.json';

export const site = {
  name: 'Gabriel’s Auto Service',
  phone: '(626) 792-8986',
  tel: 'tel:+16267928986',
  email: 'Gabrielsautobody1@gmail.com',
  address: '250 North Hill Avenue, Pasadena, CA 91106',
  directions: 'https://www.google.com/maps/search/?api=1&query=250+North+Hill+Avenue+Pasadena+CA+91106',
};

export const services = [
  { name: 'Collision Repair', path: '/collision-repair-services/', image: '/media/Gabriels-auto-service-37-b0ae75f2b841.jpg', icon: '/cras/img/car-repair.svg', copy: 'Bodywork, paint and collision repairs for your vehicle.' },
  { name: 'Mechanical Repair', path: '/mechanical-repair-services/', image: '/media/Gabriels-auto-service-46-4771f254fdcf.jpg', icon: '/cras/img/car.svg', copy: 'Diagnostics, brakes and scheduled maintenance.' },
  { name: 'Smog Checks', path: '/smog-checks/', image: '/media/Gabriels-auto-service-35-15a150657691.jpg', icon: '/cras/img/speedome.svg', copy: 'Regular and STAR smog checks in Pasadena.' },
  { name: 'Tires & Alignment', path: '/tires-alignment/', image: '/media/Gabriels-auto-service-44-0679ba3dd1c8.jpg', icon: '/cras/img/car.svg', copy: 'Tire service and wheel alignment to keep you on the road.' },
];

export const links = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about-us/' },
  { name: 'Services', path: '/our-services/' },
  { name: 'Our Work', path: '/our-work/' },
  { name: 'Service Areas', path: '/service-areas/' },
  { name: 'Blog', path: '/blog/' },
  { name: 'Contact', path: '/contact-us/' },
];

export type Entry = (typeof wordpress.pages)[number];
export const { logo, pages, posts, categories, authors } = wordpress;
export const pageSize = 9;

export const dateLabel = (date: string) => new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long', timeZone: 'UTC',
}).format(new Date(`${date}T12:00:00Z`));
