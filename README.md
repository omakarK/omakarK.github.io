# Oak & Whimsy — 100% Handcrafted Wooden Toys & Heirlooms

An animated, luxury e-commerce showcase website for an exclusive wooden toy workshop that crafts only 100% solid hardwood toys.

---

## 🌟 Highlights
- **100% Handcrafted Solid Wood**: Zero plastics, zero toxic finishes, child-safe ASTM-F963 & EN-71 standards.
- **Organic Web Audio Synthesizer**: Custom acoustic sound engine using Web Audio API to reproduce the organic resonance of wooden blocks, clicks, and marimba chimes.
- **Interactive Hardwood Species Explorer**: Deep dive into American White Oak, Black Walnut, Sugar Maple, and Mountain Beech with Janka hardness ratings and tactile grain properties.
- **Live Laser Engraving Studio**: Real-time pyrography preview where customers can personalize toys with their child's name and birth year.
- **Interactive 3D Card Tilt & Parallax**: Smooth physics-based interactive hover effects and fluid entrance animations.
- **Slide-Out Basket Drawer**: Full cart functionality with quantity adjustments, free shipping progress bar, and checkout simulation.

---

## 🚀 How to Host on GitHub Pages (github.io)

### Step 1: Create a New GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `wooden-toys` or `oak-and-whimsy`).
3. Set it to **Public**.
4. Leave "Add a README file" unchecked (we already created one).
5. Click **Create repository**.

### Step 2: Push Your Local Code to GitHub
Open your terminal in this directory (`d:\Python_Projects\LayoutDemo`) and run:
```bash
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** (tab at the top right).
3. In the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment** -> **Branch**:
   - Select **main** branch.
   - Select folder: **/ (root)**.
   - Click **Save**.
5. Within 1 to 2 minutes, your website will be live at:
   `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`

---

## 📁 Project Structure
```
LayoutDemo/
├── index.html                   # Main semantic website entry point
├── README.md                    # Deployment guide & documentation
├── .gitignore                   # Ignored files
└── assets/
    ├── css/
    │   └── styles.css           # Luxury design system, animations & responsive styling
    ├── js/
    │   ├── audio.js             # Web Audio API organic wooden acoustic synthesizer
    │   ├── products.js          # Catalog data & wood species educational database
    │   ├── animations.js        # 3D perspective tilt, parallax & counter tickers
    │   └── app.js               # Cart drawer, customizer logic, quick-view & filters
    └── images/
        ├── hero-wooden-toys.jpg      # Commercial hero photography
        ├── toy-train.jpg             # Handcrafted timber locomotive
        ├── toy-rocking-horse.jpg     # Heirloom oak rocking horse
        ├── toy-montessori-blocks.jpg # Beech Montessori rainbow arches
        ├── toy-vintage-car.jpg       # Mahogany & ash classic roadster
        └── artisan-workshop.jpg      # Master woodworker carving in studio
```

---

## 🛠️ Local Development
To test locally:
```bash
python -m http.server 3000
```
Open `http://localhost:3000` in your browser.
