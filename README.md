# Data Alchemist
**AI-Powered Data Validation & Correction System**

## Abstract

Data Alchemist is an intelligent system designed to validate, correct, and enhance large datasets in real-time. It combines manual rule-based validation with AI-powered reasoning (via Hugging Face models) to not only detect errors but also provide auto-suggestions, bulk corrections, and detailed reasoning for each correction.

At its core, Data Alchemist provides:

- **Real-Time Validation:** Validate fields, cross-references, priority levels, and more with live feedback.
- **AI-Powered Corrections:** Leverage large language models to automatically suggest and optionally apply corrections.
- **Bulk Operations:** Suggest smart bulk fixes such as tag normalization, priority adjustments, and attribute standardization.
- **Natural Language Data Editing:** Enable conversational data modifications using plain English.
- **Interactive UI:** Real-time error tracking, correction application, and AI feedback visualization.

By combining deterministic validation, AI-enhanced reasoning, and intuitive interfaces, Data Alchemist accelerates data cleaning, improves data quality, and enables users to interact with datasets at scale confidently.

---

## Features

| Feature                      | Description                                                         |
|------------------------------|---------------------------------------------------------------------|
| **REAL-TIME VALIDATION**     | Validates datasets across clients, tasks, and workers instantly.    |
| **AI-ENHANCED CORRECTIONS**  | Uses Hugging Face LLMs to suggest data fixes with reasoning.         |
| **BULK DATA OPERATIONS**     | Provides batch actions for normalization, cleanup, and corrections.  |
| **NATURAL LANGUAGE EDITING** | Allows plain English commands to manipulate datasets directly.       |
| **INTERACTIVE ERROR TRACKING**| Dynamic visualization of all validation errors and warnings.        |
| **MODULAR DESIGN**           | Separated, extensible components for easy scaling and maintenance.   |

🎯 Whether you're a data engineer, analyst, or developer, Data Alchemist simplifies data validation and correction processes with AI-powered efficiency.

-
#### Available Scripts
powershell
npm install --legacy-peer-deps  #install dependencies
npm run dev                     #run the project
npm run build                   #build the project

## Tech Stack 
| Technology            | Role                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| **Next.js**           | Frontend + backend fullstack React framework (API routes, SSR, etc.) |
| **Radix Ui**            | customizable designed components and theme                 |
| **Framer motion**    | Allows to create beautiful animations                          |
| **Docker**            | Containerization for consistent environments                         |
| **Hugging Face APi** | Provides access to different Ai models and apis                  |
| **falcon-7b-instruct** | fast and free Ai model                  |

##Precautions
->There might be some issues due to api responses from Hugging Face Api due to rate limits, as we are using Free tier right now.



