# Welcome to Learnza

> **"Your trusted digital learning companion for academic excellence."**

Use Learnza to transform how students access educational resources. We've rebuilt the entire platform from the ground up to be faster, smarter, and more reliable. It's not just a file repository; it's a fully-featured Digital Library Application designed with modern web standards in mind.

---

## What Makes This Special?

We didn't just update the old site; we re-engineered it. Here is why Learnza stands out:

### Blazing Fast Performance
Built on a **JAMstack architecture**, the site loads instantly. We stripped away heavy frameworks in favor of optimized Vanilla JavaScript and CSS, ensuring it runs smoothly on everything from high-end laptops to budget smartphones.

### Robust Download System (The "Secret Sauce")
One of the biggest challenges in web development is handling cross-origin downloads securely.
- **The Problem**: Browsers often block downloading files from external servers (like Archive.org) due to CORS policies, or they try to open PDFs instead of saving them.
- **Our Solution**: We engineered a custom **Cloudflare Worker** that acts as a secure proxy. This "middleman" grabs the file for you and hands it over with the correct permission headers, ensuring a smooth, direct download every single time—no broken links, no preview errors.

### Secure Admin Dashboard
Managing content shouldn't be a headache. Our custom admin panel lets you:
- **Create & Edit** notes with a rich interface.
- **Track Stats** like views and downloads in real-time.
- **Manage Access** securely via Supabase Authentication.
- **Mobile Friendly**: We designed the data tables to be horizontally scrollable, so you can manage your library from your phone on the go.

---

## Under the Hood: The Tech Stack

We chose technologies that offer the best balance of performance, cost (free tier friendly!), and scalability.



| Component | Technology | Why We Chose It |
|-----------|------------|-----------------|
| **Frontend** | HTML5, CSS3, ES6+ JS | Lightweight, fast, and zero dependencies. Easy to maintain. |
| **Database** | **Supabase** (PostgreSQL) | Robust, relational data storage with built-in Auth and security policies. |
| **The "Edge"** | **Cloudflare Workers** | Handles our file proxying. It's serverless, runs globally, and has no file size limits. |
| **Hosting** | **Netlify** | Serving our static assets and handling our Contact Forms automatically. |

---

## Project Structure

Here's how the project is organized, so you know exactly where to find things:

```bash
Learnza/
├── assets/             # Images, icons, and logo.svg
├── css/                
│   ├── admin.css       # Styles specifically for the Admin Dashboard
│   ├── styles.css      # Main global styles (variables, components, layout)
├── js/
│   ├── admin.js        # Logic for the Admin Panel (Auth, CRUD operations)
│   ├── config.js       # Global configuration (API Keys, Constants)
│   ├── contact.js      # Contact form handling (if adding extra logic)
│   ├── downloader.js   # The "Engine" - handles downloads, progress UI, & proxying
│   ├── main.js         # Core logic for the library home page (Search, Filtering)
│   ├── notesapi.js     # Data layer - talks to Supabase
│   ├── preview.js      # Handles PDF preview functionality
│   ├── supabaseclient.js # Initializes the Supabase connection
│   └── utils.js        # Handy helpers (Toast notifications, DOM shortcuts)
├── index.html          # Home/Library Page
├── admin.html          # Secure Admin Dashboard
├── contact.html        # Contact Page (Netlify Forms integrated)
├── download.html       # Dedicated download progress page
└── README.md           # This documentation!
```

---

## Getting Started

Want to run this project yourself? Here is how to get it up and running on your local machine.

### Prerequisites
You'll need a basic understanding of web technologies and recent versions of:
- A code editor (VS Code recommended)
- A local web server (like Live Server extension)

### 1. Clone & Run
Since this is a static site, it's super easy to launch.

```bash
# Clone the repository
git clone https://github.com/gohardev260/Learnza-E-Library

# Navigate into the folder
cd Learnza-E-Library

# Open index.html in your browser, or use a local server
# (Using Python's built-in server as an example)
python -m http.server 3000
```

### 2. Connect the Database (Supabase)
The app needs a backend to store your notes.
1. Create a free project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy and paste the contents of our `database_setup.sql` file and run it. This creates your tables and security rules automatically.
4. Get your **Project URL** and **Anon Key** from Supabase Settings -> API.
5. Paste them into `js/config.js`.

### 3. Setup the Download Proxy
To make downloads work perfectly:
1. Sign up for [Cloudflare Workers](https://cloudflare.com) (it's free!).
2. Create a new Service.
3. Paste the code for worker from.
4. Deploy it and copy your new Worker URL.
5. Update `js/downloader.js` with your URL: `const PROXY_URL = 'https://workers.dev';`.

---

## Deployment Guide

### Deploying the Website
We recommend **Netlify** for hosting.
1. Log in to Netlify and drag-and-drop your `Learnza` folder.
2. That's it! Netlify will automatically detect our forms and start collecting submissions.

### The Contact Form
You don't need a backend server for the contact form! We used **Netlify Forms**, so:
- Add `data-netlify="true"` to your form tag (already done!).
- Submissions will appear securely in your Netlify Dashboard under "Forms".
- You can even enable email notifications there!

---

## Security Measures

We take security seriously.
- **No Private Keys in Code**: The frontend only uses public ("Anon") keys.
- **Row Level Security (RLS)**: Even if someone has your key, they can't delete or edit data without being logged in as an Admin.
- **Production Ready**: We've scrubbed all `console.log` debugging lines from the final code to prevent data leaks.

---

## Need Help?

If you run into issues or have questions about the codebase, feel free to reach out via the contact form on the live site.

Happy Coding!

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
&copy; 2026 Learnza E-Library. Maintained by Gohar Rehman.
