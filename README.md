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

**LIBERO Tasks:**
- LIBERO (includes: libero_10, libero_90, libero_goal, libero_object, libero_spatial)

### Notes

- Ensure all JSON files are valid and properly formatted
- Model IDs should be unique and follow the naming convention (lowercase, hyphens)
- Missing tasks will be displayed as "-" on the leaderboard
- The leaderboard automatically loads all JSON files from `data/results/` directory
- For questions or issues, please open an issue on the repository

## Contributing Your Tasks

VLA-Arena uses a decentralized task management system, making it easy to add new tasks without modifying the core codebase. Follow these steps to contribute your own tasks:

### Task Data Structure

Each task is stored as a separate JSON file in `data/tasks/`. The task data follows this structure:

```json
{
    "id": "task_identifier",
    "name": "TaskDisplayName",
    "category": "Safety|Distractor|Extrapolation|Long Horizon|LIBERO",
    "imagePath": "figures/rollouts/task_image.png",
    "layout": "simple|split_l0l1_l2|each_level|preposition|task_workflows|unseen_objects|long_horizon|no_l0l1_instructions",
    "instructions": {
        "all": ["instruction1", "instruction2", ...],
        // OR for different difficulty levels:
        "l0": ["instruction1", ...],
        "l1": ["instruction1", ...],
        "l2": ["instruction1", ...],
        // OR for split layouts:
        "l0l1": ["instruction1", ...],
        "l2": ["instruction1", ...]
    }
}
```

**Field Descriptions:**

- `id`: Unique identifier for the task (lowercase, underscores for spaces)
- `name`: Display name shown on the Task Store page
- `category`: Task category (determines the type prefix in download commands)
- `imagePath`: Path to the task's preview image (relative to the website root)
- `layout`: Visual layout for the task detail modal. Options:
  - `simple`: L0, L1, L2 rows, then single instruction row
  - `split_l0l1_l2`: L0, L1, Instruction, then L2, Instruction
  - `each_level`: Each level (L0, L1, L2) has its own instruction row
  - `preposition`: L0 & L1 visual shared with separate instructions, then L2
  - `task_workflows`: Visual row first, then L0, L1, L2 instruction rows
  - `unseen_objects`: L0, L1, Instruction, then L2, Instruction
  - `long_horizon`: Special layout for multi-step tasks
  - `no_l0l1_instructions`: L0, L1, L2 rows, then single instruction row (no separate L0/L1 instructions)
- `instructions`: Task instructions organized by difficulty level(s)

### Steps to Add a New Task

#### 1. Prepare Task Resources

Create your task resources:

```bash
# 1. Create task visualization images (PNG format recommended)
# Place them in figures/rollouts/ directory
# Naming convention: task_id_L0_1_1.png, task_id_L1_1_1.png, task_id_L2_1_1.png, etc.

# 2. Prepare task instructions for each difficulty level
```

#### 2. Create Task JSON File

Create a new JSON file in `data/tasks/` directory:

```bash
cd vla-arena.github.io
cat > data/tasks/my_new_task.json << 'EOF'
{
    "id": "my_new_task",
    "name": "MyNewTask",
    "category": "Safety",
    "imagePath": "figures/rollouts/my_new_task_L0_1_1.png",
    "layout": "simple",
    "instructions": {
        "all": [
            "Pick up the object and place it in the container",
            "Move the red block to the blue box",
            "Stack the cups in ascending order",
            "Arrange the items on the shelf",
            "Close the drawer after placing the item"
        ]
    }
}
EOF
```

#### 3. Register the Task

Add your task ID to `data/tasks/tasks.json`:

```json
[
    "static_obstacles",
    "risk_aware_grasping",
    ...
    "my_new_task"
]
```

**Important:** Tasks are loaded in the order they appear in `tasks.json`.

#### 4. Upload Task Images

Place your task visualization images in `figures/rollouts/`:

```bash
# Example file structure:
figures/rollouts/
  ├── my_new_task_L0_1_1.png
  ├── my_new_task_L0_2_1.png
  ├── my_new_task_L1_1_1.png
  ├── my_new_task_L2_1_1.png
  └── ...
```

#### 5. Test Locally

Run the local server to test your task:

```bash
python -m http.server 8000
# Visit http://localhost:8000/index.html
# Navigate to Task Store to verify your task appears correctly
```

#### 6. Submit Your Contribution

Create a pull request with your changes:

```bash
git add data/tasks/my_new_task.json
git add data/tasks/tasks.json
git add figures/rollouts/my_new_task_*.png
git commit -m "Add MyNewTask to VLA-Arena Task Store"
git push origin main
```

Then create a pull request on GitHub with:
- Task description and motivation
- Category justification
- Sample visualizations
- Any special requirements or dependencies

### Task Layout Examples

**Simple Layout** (most common):
```json
{
    "layout": "simple",
    "instructions": {
        "all": ["task1", "task2", "task3", "task4", "task5"]
    }
}
```

**Each Level Layout** (different instructions per level):
```json
{
    "layout": "each_level",
    "instructions": {
        "l0": ["easy_task1", "easy_task2", ...],
        "l1": ["medium_task1", "medium_task2", ...],
        "l2": ["hard_task1", "hard_task2", ...]
    }
}
```

**Split Layout** (L0/L1 share, L2 separate):
```json
{
    "layout": "split_l0l1_l2",
    "instructions": {
        "l0l1": ["common_task1", "common_task2", ...],
        "l2": ["advanced_task1", "advanced_task2", ...]
    }
}
```

### Troubleshooting

**Task doesn't appear in Task Store:**
- Check that the task ID in `tasks.json` matches the filename
- Verify JSON syntax is valid (use a JSON validator)
- Ensure the task JSON file is in `data/tasks/` directory

**Images not loading:**
- Verify image paths are correct and relative to the website root
- Check that image files exist in the specified location
- Ensure image filenames match exactly (case-sensitive)

**Layout issues:**
- Review the layout type and ensure it matches your instruction structure
- Check that all required instruction fields are present
- Refer to existing task files for examples

