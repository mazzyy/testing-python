# Python Environment Setup Guide

It looks like you were running into dependency issues because you weren't using a virtual environment. This project works best when dependencies are isolated.

## Prerequisites
- Python 3.9 or higher installed.

## 1. Create a Virtual Environment

Run the following command in your terminal (inside the `backend` folder):

```bash
python3 -m venv venv
```

This creates a folder named `venv` which will hold your project-specific dependencies.

## 2. Activate the Virtual Environment

Before installing or running anything, you must activate the environment:

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
.\venv\Scripts\activate
```

You should see `(venv)` appear at the start of your command line prompt.

## 3. Install Dependencies

Now, install the clean dependencies from the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

## 4. Run the Server

Start your server as usual (ensure the environment is active!):

```bash
uvicorn app.main:app --reload
```

---
**Note:** valid `.env` file configuration is still required for the app to run correctly.
