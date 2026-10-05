Day 01 - 22/09/2026

- Installed VS Code and configured Git, connected to GitHub
- Registered Group 71 with stack (ReactJS + Vite, Express.js + Node.js)
- Added lab PC IPs: 10.50.80.153, 10.50.80.154
- Created a clean project baseline with .gitignore and a tracking log

Day 02 - 24/09/2026

- Created a separate "backend" folder for backend code
- Set up connection using Express.js
- Created the database and connected it to the backend
- Used Postman to test and verify the API endpoints

Day 03 - 25/09/2026

- Added user roles (customer, pharmacist, delivery master, admin) with JWT login
- Built order system with PG order numbers, cart orders and prescription uploads
- Added pharmacist, delivery and admin features with live order tracking
- Added database setup script with demo accounts and 48 products

Day 04 - 26/09/2026

- Built the React frontend on the "frontend" branch with all customer and staff pages
- Redesigned Home, Shop, Login, Contact and Prescription pages
- Added light/dark theme, new product photos and responsive layout
- Tested all roles; more frontend changes planned

Day 05 - 30/09/2026

- Created a Dockerfile for the backend (Node 22, port 5000)
- Created a Dockerfile for the frontend (Vite build, served with Nginx)
- Added .dockerignore files and built both images

Day 06 - 06/10/2026

- Added nginx.conf to serve the React app
- Forwarded /api and /uploads to the backend container
- Increased the upload limit for prescription files

Day 07 - 12/10/2026

- Created docker-compose.yml for db, backend and frontend
- Added volumes to keep database data and uploads
- Ran the full system with docker compose up --build

Day 08 - 27/10/2026

- Fixed the MyOrders import case and the API URL issue
- Fixed the port 5000 conflict
- Tested all user roles running in Docker


Day 09 - 10/11/2026

- Updated the frontend README and added a folder structure doc
- Added config files: .env.example, .nvmrc, .editorconfig, .prettierrc
- Added project details to package.json and updated .gitignore
