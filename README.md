# Amiibots Statistics Tool V2

A data-driven web application that processes and analyzes large-scale competitive match data to generate real-time statistics, rankings, and matchup insights.

🔗 Live Demo: https://amiibots-stats-tool.com/

🔗 Repository: https://github.com/KarlTilsner/Amiibots-Statistics-Tool-V2

---

## Overview

This project was originally built as a frontend tool relying on a third-party API for live data retrieval.

As the dataset grew and the API became increasingly slow and unreliable for this project, the system was redesigned into a **preprocessed, cached data platform**. The new architecture eliminates real-time API dependency and delivers fast, consistent performance regardless of upstream limitations.

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

External API (slow, large dataset)

        ↓

GitHub Actions (scheduled job)

        ↓

Data ingestion + preprocessing

        ↓

Optimized JSON datasets

        ↓

Frontend (fast, cached)

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
- Rating history and trends
- Win/loss records and streaks
- Leaderboard rankings (global and category-based)
- Matchup performance
- Full match history

![Alt Text](/Screenshots/amiibo%20stats%201.png)
![Alt Text](/Screenshots/amiibo%20stats%202.png)
![Alt Text](/Screenshots/amiibo%20stats%203.png)
![Alt Text](/Screenshots/amiibo%20stats%204.png)

### Rating History
- Historical performance tracking
- Top performers over time
- Duration of dominance
- Matchup distributions
- Supports multiple data rulesets

![Alt Text](/Screenshots/rating%20history%201.png)
![Alt Text](/Screenshots/rating%20history%202.png)

### Trainer Leaderboard
- Custom ranking system based on performance
- Points-based system
- Multi-entity aggregation

![Alt Text](/Screenshots/leaderboard.png)

### Trainer Statistics
- Win rate and performance metrics
- Matchups across multiple dimensions
- Full dataset of associated entities

![Alt Text](/Screenshots/trainer%20stats%201.png)

### Amiibo Search
- View all amiibo currently on Amiibots
- Fast navigation using preprocessed data
- Filtering and lookup

![Alt Text](/Screenshots/amiibo%20search.png)

### Tierlist
- Ranking based on aggregated performance metrics
- High-level overview of dataset strength distribution

![Alt Text](/Screenshots/tierlist.png)