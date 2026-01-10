# Infinite Crossing V2.0 更新日志

## 🎮 新功能概览

本次更新大幅增强了游戏的角色自定义系统、NPC交互体验，以及移动端适配。

---

## ✨ 角色自定义系统

### 创建你的专属角色

在世界生成页面（`/generate`），现在可以详细定义你的角色：

| 属性 | 说明 |
|------|------|
| **基础信息** | 名字、年龄、性别 |
| **外貌特征** | 描述你的角色长什么样 |
| **性格特点** | 角色的性格倾向 |
| **背景故事** | 出身、职业、动机、弱点 |
| **天赋资质** | 与生俱来的特殊能力 |
| **习得技能** | 后天学习的技能 |

### AI如何使用这些信息

- **NPC反应**：NPC会根据你的外貌、性别、职业做出不同反应
- **叙事风格**：故事会体现你角色的性格特点
- **技能触发**：当使用专长时会有特殊描述
- **弱点情境**：在相关场景中可能触发角色弱点

---

## 🧑‍🤝‍🧑 NPC性格系统

### 告别"木头NPC"

每个NPC现在都有独特的个性：

1. **个性化对话**
   - 每个NPC有独特的说话风格
   - 使用符合身份的口头禅、语气词
   - 反映教育程度、社会地位、情绪状态

2. **动态反应**
   - 根据玩家角色信息调整态度
   - 保守村民对外来者更警惕
   - 贵族对有教养的角色更尊重

3. **隐藏动机**
   - NPC有自己的目标
   - 可能撒谎、隐瞒、试探、利用玩家
   - 不会无条件帮助

4. **记忆系统**
   - NPC记住之前的互动
   - 态度会随关系变化

5. **怪癖特点**
   - 小动作、表情、姿态
   - 暗示隐藏信息

---

## 📱 移动端适配

### 响应式设计改进

| 组件 | 改进 |
|------|------|
| **侧边栏** | 抽屉式展开，点击外部关闭 |
| **游戏终端** | 更小的字体，触摸友好 |
| **操作面板** | 更紧凑的按钮，横向滚动 |
| **世界生成** | 表单适配小屏幕 |

### 新增标签页侧边栏

侧边栏现在分为4个标签页：

1. **状态** - 生命值、属性、天赋、任务
2. **物品** - 物品栏管理
3. **社交** - NPC关系网络
4. **地图** - 当前位置、区域、威胁

---

## 🔧 技术改进

### 新增类型定义

```typescript
// 角色自定义
interface CharacterCustomization {
    gender: Gender;
    age?: number;
    appearance?: string;
    personality?: string;
    talents: CharacterTalent[];
    aptitudes: CharacterAptitude[];
    background: CharacterBackground;
}

// NPC性格
interface NPCPersonality {
    id: string;
    name: string;
    personality: string;
    motivation: string;
    quirks: string[];
    speech_style: string;
}

// 社交关系
interface NPCRelationship {
    npc_id: string;
    disposition: NPCDisposition;
    trust_level: number;
    interaction_count: number;
}
```

### 更新的Agent提示词

- **World Agent**: 增加NPC性格系统指南
- **Narrator Agent**: 增加角色信息处理和对话指南
- **Judge Agent**: 保持不变

---

## 📝 UI文本本地化

大部分英文文本已翻译为中文：

| 原文 | 新文本 |
|------|--------|
| System initialized | 系统初始化完成 |
| Look around | 观察周围 |
| Processing turn... | 处理中... |
| INITIATE LINK | 开始探索 |
| Target Locator System | 维度定位系统 |

---

## 🚀 后续计划

- [ ] NPC关系数据持久化
- [ ] 角色档案存档/读取
- [ ] 更多主题风格选项
- [ ] 多人联机社交功能
- [ ] 语音输入支持

---

## 📋 文件变更清单

| 文件 | 变更类型 |
|------|----------|
| `src/types/game.ts` | 增加角色/NPC类型 |
| `src/types/generated-world.ts` | 增加角色创建输入 |
| `src/components/game/SidePanel.tsx` | 重构为标签页+移动端 |
| `src/components/game/ActionPanel.tsx` | 移动端适配 |
| `src/components/game/GameTerminal.tsx` | 移动端适配+中文化 |
| `src/app/generate/page.tsx` | 增加角色创建表单 |
| `src/app/game/page.tsx` | 移动端适配 |
| `src/lib/agents/prompts/world.md` | NPC性格系统 |
| `src/lib/agents/prompts/narrator.md` | 角色处理+对话指南 |