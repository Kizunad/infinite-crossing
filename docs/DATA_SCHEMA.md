# 数据结构与交互协议 (Data Schema & Interaction Protocol)

> 本文档定义了系统各组件间交互的严格 JSON 格式，适用于前端、后端 API 以及 Agent 之间的通信。

## 1. 核心实体 (Core Entities)

### 1.1 玩家档案 (Player Profile)
```json
{
  "id": "player_uuid",
  "name": "Kiz",
  "current_world_id": "world_mistwood_001",
  "status": "alive", // alive, dead, ascended
  "stats": {
    "hp": 100,          // 生命值
    "max_hp": 100,      // 最大生命值
    "power": 10         // 战力值 (0-100)
  },
  "inventory": [
    {
      "id": "item_watch",
      "name": "停摆的怀表",
      "description": "指针永远停在 6:00。",
      "type": "narrative_item"
    }
  ],
  "traits": [
    {
      "id": "trait_outsider",
      "name": "异乡人",
      "effect": "社交判定难度 +20%"
    }
  ]
}
```

### 1.2 世界状态 (World State)
*仅由 Judge 维护，World Agent 建议修改*

```json
{
  "world_id": "world_mistwood_001",
  "turn_count": 5,
  "environment": {
    "time": "18:05",
    "weather": "浓雾",
    "location": "老王修车铺"
  },
  "flags": {
    "met_mayor": true,
    "car_fixed": false,
    "ritual_progress": 15
  },
  "active_threats": [
    "mist_creatures_listening"
  ]
}
```

---

## 2. Agent 交互协议 (Agent Interaction Protocol)

### 2.1 任务系统输出 (Quest Output)
*Quest Agent -> Judge*

```json
{
  "visible_objectives": [
    {
      "id": "obj_fix_car",
      "text": "找到火花塞修好汽车",
      "status": "active"
    }
  ],
  "hidden_agenda": "引导玩家在夜间发出噪音" // Only visible to Judge
}
```

### 2.2 裁判裁决结果 (Judge Verdict)
*Judge -> Frontend / DB*

这是每一回合的核心输出，前端依据此渲染。

```json
{
  "turn_id": 12,
  "is_death": false,
  "narrative": {
    "content": "你把火花塞插入引擎，试着拧动钥匙。引擎发出轰鸣声，在这寂静的街道上如同雷鸣。你感觉到雾气似乎在因震动而聚拢...",
    "tone": "suspense"
  },
  "state_updates": {
    "hp_change": -5,
    "power_change": +2
  },
  "options": [
    {
      "id": "opt_drive",
      "text": "不管了，踩油门冲出去！",
      "risk_level": "critical", // Frontend can choose to hide or hint this
      "type": "action"
    },
    {
      "id": "opt_hide",
      "text": "立刻熄火，躲进车底。",
      "risk_level": "medium",
      "type": "stealth"
    },
    {
      "id": "opt_inspect",
      "text": "观察周围雾气的流动。",
      "risk_level": "low",
      "type": "observation"
    }
  ],
  "death_report": null // If is_death is true, populate this
}
```

### 2.3 死亡复盘报告 (Death Report)
*Judge -> Frontend (Only on Death)*

```json
{
  "cause_of_death": "被迷雾猎手撕碎",
  "trigger_action": "启动引擎发出噪音",
  "missed_clues": [
    "进入修车铺前，门口贴着'保持安静'的警告。",
    "之前的广播提到过'迷雾对声音敏感'。"
  ],
  "avoidance_suggestion": "如果当时选择'寻找消音器'或'推车离开'，也许能存活。"
}
```

---

## 3. API 接口定义 (API Endpoints)

### `POST /api/game/start`
- **Input**: `{ "world_template_id": "mistwood" }`
- **Output**: `{ "session_id": "...", "initial_verdict": { ...JudgeVerdict } }`

### `POST /api/game/turn`
- **Input**:
```json
{
  "session_id": "...",
  "player_action": {
    "type": "choice", // or "free_text"
    "content": "opt_drive" // or "I run away screaming"
  }
}
```
- **Output**: `{ "verdict": { ...JudgeVerdict } }`

### `POST /api/game/settle`
- **Input**: `{ "session_id": "...", "chosen_loot_id": "..." }`
- **Output**: `{ "success": true, "redirect": "/archive" }`
