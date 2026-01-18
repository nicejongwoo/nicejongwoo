// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Check for saved theme preference or default to 'light' mode
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
    const theme = html.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking on a nav link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;

// window.addEventListener('scroll', () => {
//     const currentScroll = window.pageYOffset;

//     if (currentScroll > 100) {
//         navbar.classList.add('scrolled');
//     } else {
//         navbar.classList.remove('scrolled');
//     }

//     lastScroll = currentScroll;
// });

// Active nav link on scroll
const sections = document.querySelectorAll('section');

function updateActiveNavLink() {
    const navbarHeight = navbar.offsetHeight;
    const scrollPosition = window.pageYOffset + navbarHeight + 50;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe all sections
sections.forEach(section => {
    observer.observe(section);
});

// Observe skill categories
const skillCategories = document.querySelectorAll('.skill-category');
skillCategories.forEach(category => {
    observer.observe(category);
});

// Observe project cards
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    observer.observe(card);
});

// Observe achievement blocks
const achievementBlocks = document.querySelectorAll('.achievement-block');
achievementBlocks.forEach(block => {
    observer.observe(block);
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            scrollToSection(target);
        }
    });
});

// Scroll to section helper function
function scrollToSection(target) {
    if (!target) return;

    const navbarHeight = navbar.offsetHeight;
    const targetId = target.getAttribute('id');

    // For home section, scroll to top
    if (targetId === 'home') {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        // For other sections, align to top with navbar offset
        const offsetTop = target.offsetTop - navbarHeight;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Skill tag hover effect - add ripple animation
const skillTags = document.querySelectorAll('.skill-tag');
skillTags.forEach(tag => {
    tag.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });

    tag.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Add parallax effect to hero section
const hero = document.querySelector('.hero');
if (hero) {
    // window.addEventListener('scroll', () => {
    //     const scrolled = window.pageYOffset;
    //     const parallax = scrolled * 0.5;
    //     hero.style.transform = `translateY(${parallax}px)`;
    // });
}

// Counter animation for achievements
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
}

// Observe achievement highlights for counter animation
const achievementHighlights = document.querySelectorAll('.achievement-highlight');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const text = entry.target.textContent;

            // Check for numbers in the text and animate them
            if (text.includes('90%')) {
                // Already animated, skip
            } else if (text.includes('1억')) {
                // Could add animation for large numbers
            }

            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

achievementHighlights.forEach(highlight => {
    counterObserver.observe(highlight);
});

// Add typing effect to hero subtitle (optional)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Initialize typing effect on page load (optional - uncomment to enable)
// window.addEventListener('load', () => {
//     const heroSubtitle = document.querySelector('.hero-subtitle');
//     if (heroSubtitle) {
//         const originalText = heroSubtitle.textContent;
//         typeWriter(heroSubtitle, originalText, 100);
//     }
// });

// Add scroll reveal animation class
const scrollRevealElements = document.querySelectorAll('.info-card, .contact-item, .timeline-content');
scrollRevealElements.forEach(element => {
    observer.observe(element);
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

window.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-konamiSequence.length);

    if (konamiCode.join('') === konamiSequence.join('')) {
        // Easter egg activated!
        document.body.style.animation = 'rainbow 2s linear infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
    }
});

// Add rainbow animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Print page functionality (optional)
function printPortfolio() {
    window.print();
}

// Add scroll-to-top button (optional - can be added to HTML if needed)
function createScrollTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-top-btn';
    button.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s, transform 0.3s;
        z-index: 999;
        box-shadow: var(--shadow-lg);
    `;

    document.body.appendChild(button);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
        } else {
            button.style.opacity = '0';
            button.style.transform = 'scale(0.8)';
        }
    });

    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });
}

// Initialize scroll-to-top button
createScrollTopButton();

// Console message for developers
console.log('%c안녕하세요! 👋', 'color: #2563eb; font-size: 24px; font-weight: bold;');
console.log('%c이 포트폴리오를 확인해 주셔서 감사합니다.', 'color: #6b7280; font-size: 14px;');
console.log('%c개발자 도구를 확인하시는군요! 좋습니다. 😊', 'color: #3b82f6; font-size: 14px;');
console.log('%cGitHub: https://github.com/nicejongwoo', 'color: #10b981; font-size: 12px;');
