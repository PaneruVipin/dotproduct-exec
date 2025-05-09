# 💸 Personal Budget Tracker

A full-stack personal budget management application where users can track income, expenses, set monthly budgets, and visualize financial data. Built with **Next.js + Redux + Tailwind CSS** on the frontend and **Django + Django REST Framework** on the backend.

---

## 🌐 Live Demo

- **Frontend:** [https://vipin-dotproduct.netlify.app/](https://vipin-dotproduct.netlify.app/)
- **Backend (DRF Browsable API):** [https://dotproduct-exec.onrender.com/api/](https://dotproduct-exec.onrender.com/api/)
  > ⚠️ _Note: The backend is hosted on Render free tier. Cold start may cause delay on the first request. PostgreSQL instance will expire around **June 5, 2025**._

---

## 🔑 Login Credentials

```

Email: john.doe@example.com
Password: password

```

You may also create a new account via the frontend.

---

## 🗂️ Repository Structure

Monorepo with separate directories for frontend and backend:
- [`/frontend`](./frontend): Next.js app with Redux, Tailwind CSS, D3.js
- [`/backend`](./backend): Django + Django REST Framework API

GitHub Repo: [https://github.com/PaneruVipin/dotproduct-exec](https://github.com/PaneruVipin/dotproduct-exec)

---

## 🚀 Features

### Authentication
- DRF token-based authentication
- Only authenticated users can manage financial data
- Redux used for managing auth state on the frontend

### Dashboard (D3.js)
- Pie chart for category-wise expenses
- Bar chart for comparing monthly budget vs actual expenses

### Transaction Management
- Add, edit, delete transactions
- Filter by category, amount, or date
- Paginated transaction list

### Budget Management
- Set monthly budget
- Visual comparison of budget vs expenses

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS, Radix UI
- **State Management:** Redux
- **Visualization:** D3.js
- **Hosting:** Netlify

### Backend
- **Framework:** Django + Django REST Framework
- **Database:** PostgreSQL (Render)
- **Auth:** DRF Token Authentication
- **Hosting:** Render

---

## 🧠 LLM & Library Credits

- **ChatGPT (OpenAI)** was used extensively for planning, code generation, and debugging help.
- Open Source Libraries:
  - `next`, `react`, `redux`, `@reduxjs/toolkit`, `tailwindcss`, `@radix-ui`, `d3`
  - `django`, `djangorestframework`, `django-filter`, `psycopg2`

---

## 📌 Notes

- Password recovery and profile management are not implemented as per project scope.
- Each user’s financial data is isolated and secure.
- Backend availability is guaranteed until **June 5, 2025**.

---

## 📥 Submission

All deliverables submitted as per instructions:
- ✅ Hosted frontend
- ✅ Hosted backend (DRF)
- ✅ GitHub monorepo
- ✅ Test credentials

