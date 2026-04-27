# Amiibots Statistics Tool V2

A data-driven web application that processes and analyzes large-scale competitive match data to generate real-time statistics, rankings, and matchup insights.
Also designed to be mobile-friendly 

🔗 Live Demo: https://amiibots-stats-tool.com/

---

## Overview

This project was originally built as a frontend tool relying on a third-party API for live data retrieval.

As the dataset grew and the API became increasingly slow and unreliable for this project, the system was redesigned into a **preprocessed, cached data platform**. The new architecture eliminates real-time API dependency and delivers fast, consistent performance regardless of upstream limitations.

### Before vs After

| Metric              | Before (API-driven) | After (Pipeline) |
|--------------------|-------------------|------------------|
| Data Source         | Live API           | Preprocessed JSON, fully eliminated API usage on frontend|
| Data Size           | Some API endpoints sorted through ~7GB of raw data per request           | <1MB per request (most requests are low KBs)  |
| Load Time           | 30+ seconds, some endpoints failed depending on the search      | ~1 second         |
| Reliability         | Inconsistent       | Stable            |
| Processing Location | Frontend           | Hybrid during automation step and frontend for easily managed files|

---

## Problem

The external API presented several challenges:

- Large dataset (>~7GB of raw match data at the time of writing this)
- Slow response times for complex queries (some responses failed)
- Unreliable performance for real-time usage
- High latency when loading statistics in the frontend

This made the original application difficult to scale and resulted in poor user experience.

---

## Solution

The system was redesigned to use a **serverless data pipeline with preprocessing and caching**.

Instead of fetching raw data on demand, the application now:

- Retrieves data at scheduled intervals
- Processes and aggregates it into optimized structures
- Stores lightweight, query-ready datasets
- Serves precomputed data directly to the frontend

This introduces a small delay in data freshness (typically a few hours), but results in **near-instant load times and significantly improved reliability**.

---

## Architecture

1. External API (slow, large dataset)
2. GitHub Actions (scheduled job)
3. Data ingestion + preprocessing
4. Optimized JSON datasets
5. Frontend

---

## Data Pipeline

A GitHub Actions workflow runs on a schedule to:

- Fetch raw data from the external API
- Process and transform the data into usable formats
- Aggregate statistics (win rates, rankings, matchups)
- Output structured JSON files optimized for frontend use
- Commit updated datasets to the repository

### Key Design Decisions

- Move all heavy computation out of the frontend
- Precompute statistics to avoid repeated calculations
- Split data into smaller, targeted files for efficient loading
- Eliminate redundant and unnecessary raw data

---

## Performance & Data Optimization

The original dataset consisted of over ~7GB of raw match data, which was impractical for frontend use.

A preprocessing pipeline was implemented to transform this data into efficient, query-ready formats.

### Results
- Reduced dataset size from ~7GB raw data → <2GB processed data
- Generated lightweight JSON files (<1MB, often ~50KB) per request
- Eliminated large real-time API calls from the frontend
- Reduced load times from ~[X–Y seconds] → near-instant (<1s)
- Improved reliability for all major queries

This transformation allowed the application to evolve from a slow, API-dependent tool into a high-performance data platform.

---

### Tech Stack
Frontend: JavaScript, HTML, CSS

Data Processing: Python / JavaScript

Automation: GitHub Actions

Data Source: External REST API

---

## Key Features
### Amiibo Statistics
Displays a full rundown of your amiibo, including rating history, hidden rating stats, win streaks, leaderboard position (overall and character based), character matchups, potential opponents, and a full match history.

![Alt Text](/Screenshots/amiibo%20stats%201.png)
![Alt Text](/Screenshots/amiibo%20stats%202.png)
![Alt Text](/Screenshots/amiibo%20stats%203.png)
![Alt Text](/Screenshots/amiibo%20stats%204.png)

---

### Rating History
Displays the entire history of a selected character, which trainers had the highest rating at the time, who was the highest rated for the longest, basic stats of the character, and a full matchup chart of the selected character.

![Alt Text](/Screenshots/rating%20history%201.png)

---

### Trainer Leaderboard
This is my interpretation on a ranking system for Amiibots, it scores each trainer on their current status for each amiibo. Each amiibo a trainer has in the top 10 will award points. If a trainer has multiple amiibo in the top 10, the highest will be awarded full points and the subsequent will earn 1 point each. Clicking on a character icon will open up the amiibots leaderboard, and clicking on a trainer name will redirect to the trainer stats tab.

![Alt Text](/Screenshots/leaderboard.png)

---

### Trainer Statistics
Displays a ton of misc stats about a selected trainer such as their most used character, win/loss streaks, winrate, leaderboard position, matchups against other trainers/characters/amiibo, and all their amiibo with basic stats.

![Alt Text](/Screenshots/trainer%20stats%201.png)

---

### Amiibo Search
Amiibo Search does exactly that, searches all amiibo currently on amiibots, clicking on any of these amiibo will redirect to the amiibo stats tab to view detailed stats about it.

![Alt Text](/Screenshots/amiibo%20search.png)

---

### Tierlist
The Tierlist is my interpretation of an Amiibots tierlist, the positions are based on the global average rating of all amiibo on amiibots, all characters are scaled based off of this value.

![Alt Text](/Screenshots/tierlist.png)
