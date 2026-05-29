// Learnza 2.0 - Contact Form
import { initSupabase } from './supabaseclient.js';
import { $, toast, initIcons, initMobileMenu } from './utils.js';

async function init() {
    await initSupabase();
    bindEvents();
    initIcons();
    initMobileMenu();
}

function bindEvents() {
    const form = $('#contactForm');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = $('#name').value.trim();
            const email = $('#email').value.trim();
            const subject = $('#subject').value.trim();
            const message = $('#message').value.trim();

            if (!name || !email || !subject || !message) {
                toast('Please fill in all fields', 'warning');
                return;
            }

            try {
                // Here you can send to your backend or email service
                console.log('Contact form submission:', { name, email, subject, message });

                toast('Message sent successfully!', 'success');
                form.reset();
            } catch (error) {
                console.error('Error sending message:', error);
                toast('Failed to send message', 'error');
            }
        });
    }
}

init();
