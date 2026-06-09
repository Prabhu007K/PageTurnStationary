# PageTurn Stationery — E-Commerce Store

A full-featured stationery shop built with vanilla HTML, CSS, and JavaScript. Browse books, pens, notebooks, and accessories — with cart, checkout, user accounts, and an owner admin panel.

## Live Demo

<!-- Replace with your deployed URL after publishing -->
`https://prabhu007k-pageturnstationary.netlify.app/`

## Features

- **Product catalog** — categories, search, and stock indicators
- **Product detail pages** — colours, ruled/unruled types, and variant pricing
- **Shopping cart & checkout** — quantity controls and order summary
- **User login** — sign in with phone or email
- **Purchase history** — past orders saved per account
- **Admin panel** (`admin.html`) — add/edit products, manage stock, view orders
- **localStorage persistence** — demo data with no backend required

## Tech Stack

- HTML5, CSS3 (Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Browser localStorage API

## Project Structure

```
├── index.html          # Shop homepage
├── product.html        # Product detail page
├── admin.html          # Owner dashboard
├── css/
│   ├── style.css
│   └── admin.css
├── js/
│   ├── store.js        # Catalog, orders, users, purchase history
│   ├── shop-common.js  # Shared cart, login, checkout
│   ├── app.js          # Product grid
│   ├── product.js      # Detail page logic
│   └── admin.js
├── description.txt
└── README.md
```

## Run Locally

No build step or dependencies required.

**Option 1 — Open directly**

Open `index.html` in your browser.

**Option 2 — Local server (recommended)**

```bash
python serve.py
```

Then visit `http://localhost:4002`

**Admin demo login:** password `pageturn2026` on `admin.html`

## Deploy to Netlify

1. Create a GitHub repository and upload this folder (or use [Netlify Drop](https://app.netlify.com/drop) to drag the folder).
2. In Netlify: **Add new site → Import an existing project** (or use Drop).
3. **Build command:** leave empty  
4. **Publish directory:** `.` (project root)
5. Deploy. Your site will be live at `https://<site-name>.netlify.app/`

Upload at minimum: `index.html`, `product.html`, `admin.html`, `css/`, and `js/`.

## Deploy to GitHub Pages

1. Create a repository and push the project files to the root.
2. Go to **Settings → Pages → Deploy from branch → main → / (root)**.
3. Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Author

K Prabhu
