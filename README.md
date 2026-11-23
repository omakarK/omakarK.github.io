# Oak & Whimsy — 100% Handcrafted Indian Wooden Toys & Heirlooms

An animated, luxury e-commerce website for an exclusive wooden toy workshop founded by **Swapnil Kulkarni** and **Bhavya Kulkarni** in **Jarag Nagar, Kolhapur, Maharashtra, India**.

---

## 🌟 Highlights
- **100% Solid Indian Hardwoods**: Hand-carved from seasoned CP Sagwan (Teakwood), Indian Rosewood (Sheesham), Golden Haldu, and Ivory Wood (Wrightia).
- **Founders**: Swapnil Kulkarni & Bhavya Kulkarni.
- **Workshop & Studio**: Plot No. 42, Near Datta Mandir, Jarag Nagar, Kolhapur - 416008, Maharashtra, India.
- **Indian Pricing (₹ INR)**: Complete Indian Rupee formatting with free express shipping across India on orders above ₹1,499.
- **Zero Plastics & Child-Safe**: Treated exclusively with food-grade beeswax and cold-pressed natural oils, meeting BIS IS-9873 standards.
- **Organic Web Audio Synthesizer**: Acoustic sound engine replicating resonant hardwood taps and marimba chimes.
- **Live Laser Engraving Studio**: Real-time laser pyrography preview where customers can inscribe their child's name and town onto the wooden toy surface.
- **Slide-Out Basket Drawer**: Full cart functionality in ₹ INR with free delivery progress tracker.

---

## Shop workflows

| Area | Workflow |
| --- | --- |
| Storefront | Browse categories, save a wishlist, personalize eligible toys, and add products or discounted combos to the basket. |
| Checkout | Enter an Indian delivery address, review stock and the final INR total, and place a cash-on-delivery order. Shipping is free from ₹1,499. |
| Admin catalog | Add, edit, unpublish, or delete products. Manage category names and sort order. |
| Admin offers | Edit the offers section heading and introduction. Publish and price combos, choose included quantities, and upload or remove photos and videos. |
| Admin orders | Review delivery and engraving details, filter by status, and update fulfilment or tracking. Cancelling an unshipped order returns its stock. |
| Admin traffic | See visits, distinct browsers, recent activity, and daily and per-section counts. |

The storefront and admin use React. NestJS serves the API and built frontend. MySQL stores catalog, inventory, offers and media, orders, admin sessions, newsletter signups, and anonymous traffic. Checkout calculates prices on the server and reserves stock in the same transaction that saves the order. Order line snapshots preserve the purchased product names, prices, and options after catalog edits.

## Run locally

Use Node.js 22.12 or newer and MySQL 8.0.16 or newer. Create a database and a dedicated local MySQL account. Run this in MySQL as a database administrator, replacing the example password with a generated password.

```sql
CREATE DATABASE oak_whimsy CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'oak_shop'@'127.0.0.1' IDENTIFIED BY 'replace-with-generated-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, REFERENCES, INDEX
  ON oak_whimsy.* TO 'oak_shop'@'127.0.0.1';
```

Copy `.env.example` to `.env` and set `DATABASE_URL`. Percent-encode any URL-reserved characters in the database password. Then run from the repository root.

```powershell
npm ci
npm run build
npm run db:setup
$shopPassword = Read-Host 'Choose an admin password (at least 12 characters)' -AsSecureString
[System.Net.NetworkCredential]::new('', $shopPassword).Password | npm run admin -- shopowner
Remove-Variable shopPassword
npm start
```

Open [the storefront](http://127.0.0.1:3000/) and [Shop Admin](http://127.0.0.1:3000/admin). Sign in with the account you created. The setup command seeds the existing demo catalog and a sample combo once. Running the admin command again for an existing username resets its password and revokes its sessions.

For frontend development, keep the backend running and run `npm run dev` in a second terminal. Vite forwards API and media requests to the local backend.

## Deploy behind Nginx

The existing GitHub Pages hostname is recorded in `CNAME`. Serve the dynamic shop from a host running Node.js and Nginx with a reachable MySQL database. Use the included `deploy/nginx.conf` as an Nginx site configuration, point the domain to that host, and install a TLS certificate. Set `SHOP_ORIGIN` to the HTTPS origin and `SHOP_TRUST_PROXY=1`, then build, initialise the database, create an admin, and run `npm start` under the host’s process supervisor. Validate the Nginx configuration with `nginx -t` before reloading.

The backend defaults to loopback. Admin operations require a MySQL-backed session, HTTP-only cookies, and a CSRF token for changes. Write requests validate their origin and input. NestJS limits API calls and sign-in attempts, and Nginx adds per-client API throttling. Keep the database and uploaded media backed up. If the database uses a reduced `max_allowed_packet`, configure at least 32 MB to accept 30 MB video uploads.

Checkout records cash-on-delivery orders. Newsletter signup records the email address in MySQL. Customer receipts and newsletter delivery can be connected to a mail provider separately.
