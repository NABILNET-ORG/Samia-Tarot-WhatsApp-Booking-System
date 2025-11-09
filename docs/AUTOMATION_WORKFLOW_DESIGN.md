# 🤖 Automation Workflow Builder - Design Document

**Feature:** Visual workflow builder for customizing conversation automation
**Goal:** Allow admins to customize the conversation flow without coding
**Complexity:** Advanced (drag-drop, visual builder)

---

## 🎯 FEATURE OVERVIEW

### What It Does:
Allows admins to visually design the conversation flow:
- **Current:** Hardcoded (Greeting → Service Selection → Name → Time → Payment)
- **New:** Drag-and-drop customizable workflow builder

### Key Features:
1. **Visual Builder** - Drag-drop nodes to create flow
2. **Step Types:**
   - Message (send text to customer)
   - Question (ask for input)
   - Condition (if/then logic)
   - Action (create booking, send payment link, etc.)
   - AI Response (let AI handle)
3. **Flexible Flow** - Change order, add/remove steps
4. **Per-Business** - Each business can have custom workflows
5. **Version Control** - Save multiple versions, rollback
6. **Test Mode** - Preview workflow before activating

---

## 📊 DATABASE SCHEMA

### Table 1: `automation_workflows`
```sql
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Workflow Info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) DEFAULT 'new_conversation',

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,

  -- Configuration
  config_json JSONB DEFAULT '{}',

  -- Metadata
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,

  -- Stats
  times_executed INTEGER DEFAULT 0,
  success_rate DECIMAL,
  avg_completion_time_seconds INTEGER
);
```

### Table 2: `workflow_steps`
```sql
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,

  -- Step Info
  step_name VARCHAR(100) NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'message', 'question', 'condition', 'action', 'ai'

  -- Position in flow
  position INTEGER NOT NULL,
  parent_step_id UUID REFERENCES workflow_steps(id),

  -- Configuration (flexible JSON)
  config JSONB NOT NULL DEFAULT '{}',

  -- Examples:
  -- For 'message': { "text": "Hello!", "template_id": "uuid" }
  -- For 'question': { "text": "What's your name?", "variable": "customer_name", "validation": "required" }
  -- For 'condition': { "variable": "service_type", "operator": "equals", "value": "tarot" }
  -- For 'action': { "type": "create_booking", "params": {...} }

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table 3: `workflow_transitions`
```sql
CREATE TABLE workflow_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,

  -- From/To
  from_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  to_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,

  -- Condition (optional - if empty, always transition)
  condition_type VARCHAR(50), -- 'always', 'equals', 'contains', 'custom'
  condition_config JSONB DEFAULT '{}',

  -- Priority (for multiple transitions from same step)
  priority INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table 4: `workflow_executions`
```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  business_id UUID NOT NULL REFERENCES businesses(id),

  -- Execution
  current_step_id UUID REFERENCES workflow_steps(id),
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'abandoned'

  -- Context (variables collected during flow)
  variables JSONB DEFAULT '{}',

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Stats
  total_steps_executed INTEGER DEFAULT 0,
  duration_seconds INTEGER
);
```

---

## 🎨 UI/UX DESIGN

### Page: `/dashboard/admin/workflows`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Automation Workflows                    [+ New]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │ Default Booking Flow │  │ VIP Customer Flow│   │
│  │ ● Active             │  │ ○ Inactive       │   │
│  │ 5 steps              │  │ 3 steps          │   │
│  │ Used 127 times       │  │ Never used       │   │
│  │ [Edit] [Test] [...]  │  │ [Edit] [Activate]│   │
│  └──────────────────────┘  └──────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Page: `/dashboard/admin/workflows/[id]/edit`

**Visual Builder:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Workflows          [Test] [Save Draft] [Publish] │
├─────────────────┬───────────────────────────────────────────┤
│ Step Library    │ Canvas (Drag-Drop Area)                   │
├─────────────────┤                                           │
│                 │     ┌─────────────┐                       │
│ 📤 Send Message │     │  1. Greeting│                       │
│ ❓ Ask Question │     │  "Hello!"   │                       │
│ 🔀 Condition    │     └──────┬──────┘                       │
│ ⚡ Action       │            │                               │
│ 🤖 AI Response  │     ┌──────▼──────┐                       │
│                 │     │ 2. Ask Name │                       │
│ [+ Add Custom]  │     │ "Your name?"│                       │
│                 │     └──────┬──────┘                       │
│                 │            │                               │
│                 │     ┌──────▼─────────┐                    │
│                 │     │ 3. Show Services│                   │
│                 │     │ List services   │                   │
│                 │     └──────┬──────────┘                   │
│                 │            │                               │
│                 │     ┌──────▼──────┐                       │
│                 │     │ 4. Payment  │                       │
│                 │     │ Send link   │                       │
│                 │     └─────────────┘                       │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

---

## 🔧 STEP TYPES & CONFIGURATIONS

### 1. Message Step
**Purpose:** Send a text message to customer
**Config:**
```json
{
  "type": "message",
  "text": "Hello! Welcome to Samia Tarot 🔮",
  "template_id": "uuid-optional",
  "delay_seconds": 0
}
```

### 2. Question Step
**Purpose:** Ask customer for input
**Config:**
```json
{
  "type": "question",
  "text": "What's your full name?",
  "variable_name": "customer_name",
  "validation": {
    "required": true,
    "min_length": 2,
    "max_length": 100,
    "pattern": "^[a-zA-Z ]+$"
  },
  "retry_message": "Please provide a valid name"
}
```

### 3. Condition Step
**Purpose:** Branch based on logic
**Config:**
```json
{
  "type": "condition",
  "variable": "service_type",
  "operator": "equals",
  "value": "tarot",
  "true_next_step": "step-uuid-1",
  "false_next_step": "step-uuid-2"
}
```

### 4. Action Step
**Purpose:** Perform system action
**Config:**
```json
{
  "type": "action",
  "action": "create_booking",
  "params": {
    "service_id": "{selected_service}",
    "customer_name": "{customer_name}",
    "scheduled_date": "{selected_date}"
  }
}
```

### 5. AI Response Step
**Purpose:** Let AI handle dynamically
**Config:**
```json
{
  "type": "ai_response",
  "prompt": "Help customer select a service",
  "max_tokens": 200,
  "extract_variables": ["service_preference", "urgency"]
}
```

---

## 🔄 WORKFLOW EXECUTION ENGINE

### How It Works:

1. **Conversation starts** → Load active workflow for business
2. **Execute step by step:**
   - Send message / Ask question
   - Wait for customer response
   - Validate response
   - Save to variables
   - Move to next step
3. **Handle conditions:** Branch based on customer input
4. **Execute actions:** Create bookings, send payments, etc.
5. **Complete:** Mark workflow execution as done

### State Management:
- Each conversation tracks: `current_step_id`, `workflow_variables`
- Resume from where it left off
- Handle interruptions (human takeover)

---

## 📋 IMPLEMENTATION PHASES

### Phase 1: Database (30 min)
- Create 4 tables
- Add indexes and RLS
- Migration files

### Phase 2: Backend API (1-2 hours)
- CRUD for workflows
- CRUD for steps
- Execution engine
- Integration with conversation-engine

### Phase 3: Frontend UI (2-3 hours)
- Workflow list page
- Visual builder page (drag-drop)
- Step configuration modals
- Testing interface

### Phase 4: Testing (30 min)
- Test workflow creation
- Test execution
- Test edge cases
- Full integration test

**Total Time:** 4-6 hours

---

## 🎯 SIMPLIFIED MVP (Faster Implementation)

**If you want faster (2-3 hours total):**

Instead of full drag-drop visual builder:
1. **Form-based builder** (simpler)
2. **List of steps** (add/remove/reorder)
3. **Step configuration forms**
4. **Live preview** of flow

This is 50% faster to build and still very flexible!

---

## 💡 YOUR CHOICE

**Option A: Full Visual Builder (4-6 hours)**
- Drag-drop nodes
- Visual connections
- Beautiful UI
- More complex

**Option B: Form-Based Builder (2-3 hours)**
- List with add/remove
- Forms for each step
- Reorder with up/down buttons
- Simpler but fully functional

**Which do you prefer?** I'll implement whichever you choose!

Both give you complete flexibility to change the automation flow from the dashboard.
