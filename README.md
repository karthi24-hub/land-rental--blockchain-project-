<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>


## Run Locally

**Prerequisites:**  Node.js

Backend Setup
The backend handles property and agreement data using MongoDB.

Navigate to the server directory:
cd proj/server
Install dependencies:
npm install
Start the server:
npm start
Frontend & Blockchain Setup
The frontend is built with React and Vite. It interacts with the blockchain via ethers.js.

Navigate to the main proj directory:

cd proj
Install dependencies:

npm install
Compile Smart Contracts: The frontend needs the latest contract ABI and Bytecode.

node compile.cjs
This updates 
metadata.json


npm run dev



1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
