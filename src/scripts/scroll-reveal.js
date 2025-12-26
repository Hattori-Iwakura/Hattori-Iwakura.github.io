// Scroll Reveal Animation
document.addEventListener('DOMContentLoaded', () => {
	const revealElements = document.querySelectorAll(
		'.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale'
	);

	const revealOnScroll = () => {
		const windowHeight = window.innerHeight;
		const revealPoint = windowHeight * 0.85; // Trigger when 85% visible

		revealElements.forEach((element) => {
			const elementTop = element.getBoundingClientRect().top;

			if (elementTop < revealPoint) {
				element.classList.add('revealed');
			}
		});
	};

	// Initial check
	revealOnScroll();

	// Listen to scroll events with throttling
	let ticking = false;
	window.addEventListener('scroll', () => {
		if (!ticking) {
			window.requestAnimationFrame(() => {
				revealOnScroll();
				ticking = false;
			});
			ticking = true;
		}
	});
});
