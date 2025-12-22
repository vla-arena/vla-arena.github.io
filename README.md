# VLA-Arena Leaderboard

This repository hosts the VLA-Arena benchmark leaderboard, showcasing performance results of various Vision-Language-Action (VLA) models across multiple task categories and difficulty levels.

## Contributing Your Model Results

To add your model's evaluation results to the leaderboard, follow these steps:

### 1. Fork and Clone the Repository

First, fork this repository on GitHub, then clone your forked repository:

```sh
git clone https://github.com/<your-username>/vla-arena.github.io.git
cd vla-arena.github.io
```

### 2. Run VLA-Arena Evaluation

Run the VLA-Arena evaluation code to generate your model's results:

```sh
# TODO: Add the command to run VLA-Arena evaluation
# This will generate intermediate results and final results
```

The evaluation process will automatically generate:

#### Intermediate Results
Intermediate evaluation results will be saved to `data/runs/<model_id>/`:
- Raw evaluation outputs
- Detailed logs
- Intermediate analysis files

#### Final Results
The final results JSON file will be generated at `data/results/<model_id>.json` with the following structure:

```json
{
  "name": "Your Model Name",
  "id": "your-model-id",
  "tasks": [
    {
      "name": "TaskName",
      "category": "Safety|Distractor|Extrapolation|Long Horizon",
      "hasCC": true|false,
      "data": {
        "sr": [0.0, 0.0, 0.0],
        "cc": [0.0, 0.0, 0.0],
        "srBold": [0, 0, 0],
        "ccBold": [0, 0, 0]
      }
    }
  ]
}
```

**Field Descriptions:**
- `name`: Display name of your model
- `id`: Unique identifier (lowercase, use hyphens for spaces, e.g., "my-model-v2")
- `tasks`: Array of all tasks in VLA-Arena
  - `name`: Task name (must match existing task names)
  - `category`: One of "Safety", "Distractor", "Extrapolation", or "Long Horizon"
  - `hasCC`: `true` for Safety tasks, `false` for others
  - `data`: Performance data
    - `sr`: Success Rate array [L0, L1, L2] (values between 0.0 and 1.0)
    - `cc`: Cumulative Cost array [L0, L1, L2] (only for Safety tasks, lower is better)
    - `srBold`: Array indicating which difficulty levels have the best SR [0 or 1 for each level]
    - `ccBold`: Array indicating which difficulty levels have the best CC [0 or 1 for each level]

**Note:** If your model doesn't have data for a specific task, you can omit that task from the `tasks` array, or set `data` to `null`. The leaderboard will display "-" for missing data.

### 3. Upload Your Model Results

After running the evaluation, the results will be automatically generated. Upload them to the repository:

```sh
# Add the final results JSON file (required)
git add data/results/<model_id>.json

# Add intermediate results (optional but recommended)
git add data/runs/<model_id>/

# Commit your changes
git commit -m "Add <model_name> to VLA-Arena leaderboard"

# Push to your fork
git push origin main
```

### 4. Create a Pull Request

1. Go to the [VLA-Arena repository](https://github.com/PKU-Alignment/VLA-Arena/pulls) (or the appropriate repository URL)
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR description with:
   - Model name and description
   - Brief summary of results
   - Any relevant notes about the evaluation setup
5. Submit the pull request

### Example

Here's a complete example for adding a model called "MyVLA":

```sh
# 1. Fork and clone (already done)

# 2. Create the model result file
cat > data/results/my-vla.json << 'EOF'
{
  "name": "MyVLA",
  "id": "my-vla",
  "tasks": [
    {
      "name": "StaticObstacles",
      "category": "Safety",
      "hasCC": true,
      "data": {
        "sr": [0.85, 0.72, 0.45],
        "cc": [0, 12.5, 35.2],
      }
    },
    {
      "name": "StaticDistractors",
      "category": "Distractor",
      "hasCC": false,
      "data": {
        "sr": [0.92, 0.68, 0.34],
        "srBold": [1, 0, 0]
      }
    }
    // ... add all other tasks
  ]
}
EOF

# 3. Add and commit
git add data/results/my-vla.json
git commit -m "Add MyVLA to VLA-Arena leaderboard"
git push origin main

# 4. Create PR on GitHub
```

### Task List Reference

Make sure to include all tasks in your JSON file. The complete task list includes:

**Safety Tasks:**
- StaticObstacles
- CautiousGrasp
- HazardAvoidance
- StatePreservation
- DynamicObstacles

**Distractor Tasks:**
- StaticDistractors
- DynamicDistractors

**Extrapolation Tasks:**
- PrepositionCombinations
- TaskWorkflows
- UnseenObjects

**Long Horizon Tasks:**
- LongHorizon

### Notes

- Ensure all JSON files are valid and properly formatted
- Model IDs should be unique and follow the naming convention (lowercase, hyphens)
- Missing tasks will be displayed as "-" on the leaderboard
- The leaderboard automatically loads all JSON files from `data/results/` directory
- For questions or issues, please open an issue on the repository

