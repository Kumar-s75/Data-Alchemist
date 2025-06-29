# Data Alchemist  
**AI-Powered Data Validation & Correction System**

---

## 📄 Abstract

**Data Alchemist** is an intelligent system designed to validate, correct, and enhance large datasets in real-time. It combines manual rule-based validation with AI-powered reasoning (via Hugging Face models) to not only detect errors but also provide auto-suggestions, bulk corrections, and detailed reasoning for each correction.

### Core Capabilities:
- **Real-Time Validation:** Live validation of fields, cross-references, priority levels, and more.
- **AI-Powered Corrections:** Utilizes large language models to automatically suggest and apply corrections.
- **Bulk Operations:** Smart bulk fixes like tag normalization, priority adjustments, and attribute standardization.
- **Natural Language Data Editing:** Conversational, plain-English data manipulation.
- **Interactive UI:** Real-time error tracking, correction application, and AI feedback visualization.

By combining deterministic validation, AI-enhanced reasoning, and an intuitive interface, **Data Alchemist** accelerates data cleaning, improves data quality, and empowers confident interaction with large datasets.

---

## 🚀 Features

| Feature                       | Description                                                        |
|--------------------------------|--------------------------------------------------------------------|
| **Real-Time Validation**       | Validates datasets across clients, tasks, and workers instantly.   |
| **AI-Enhanced Corrections**    | Uses Hugging Face LLMs to suggest data fixes with detailed reasoning.|
| **Bulk Data Operations**       | Provides batch actions for normalization, cleanup, and corrections. |
| **Natural Language Editing**   | Allows plain English commands to manipulate datasets directly.      |
| **Interactive Error Tracking** | Dynamic visualization of all validation errors and warnings.       |
| **Modular Design**             | Separated, extensible components for easy scaling and maintenance.  |

🎯 Whether you're a data engineer, analyst, or developer, **Data Alchemist** simplifies data validation and correction processes with AI-powered efficiency.

---

## 🛠️ Available Scripts

`bash
# Install dependencies
npm install --legacy-peer-deps

# Run the development server
npm run dev

# Build the project for production
npm run build


## Tech Stack 
| Technology            | Role                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| **Next.js**           | Frontend + backend fullstack React framework (API routes, SSR, etc.) |
| **Radix Ui**            | customizable designed components and theme                 |
| **Framer motion**    | Allows to create beautiful animations                          |
| **Docker**            | Containerization for consistent environments                         |
| **Hugging Face APi** | Provides access to different Ai models and apis                  |
| **falcon-7b-instruct** | fast and free Ai model                  |

## Precautions

*   The Hugging Face API is currently being accessed via the **free tier**, which may lead to:
*     
*   Occasional rate-limiting issues.
*         
*   Potential slow API responses.
*         
*   Temporary API unavailability



