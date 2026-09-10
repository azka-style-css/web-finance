# Class Financial Management

A Node.js web application designed to manage, record, and summarize class finances efficiently.

## Key Features
* Dashboard: Overview of financial balance and recent activities.
* Income: Record incoming financial transactions.
* Expense: Record outgoing financial transactions.
* Cash Data: Summary and reports of overall transaction history.

## Project Structure
keuangan_kelas/
├── index.js                 # Main server (Entry point)
├── connect.js               # Connection and data management setup
├── package.json             # Node.js configuration and dependencies
└── public/                  # Frontend assets
    ├── style.css            # Layout and stylesheet
    ├── html/                # Pages (dashboard, income, expense, cash data)
    └── js/                  # Interactive logic (UI, CRUD operations)

## Prerequisites
* Node.js (v14 or higher)
* NPM (Node Package Manager)

## Installation and Setup

1. Open your terminal and enter the project directory:
   cd keuangan_kelas

2. Install project dependencies:
   npm install

3. Start the server:
   node index.js

4. Open the application:
   Navigate to http://localhost:3000 in your web browser.