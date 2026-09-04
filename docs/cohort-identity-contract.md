# 届别身份与跨届守卫契约

> 2026-09-04 定稿。任何改动 `lockRuntimeCohortId / CURRENT_COHORT_ID / CURRENT_PROJECT_KEY / CURRENT_EXAM_ID`
> 读写顺序的提交，都必须同步更新本文与 `scripts/test-cohort-identity-contract.js`。

## 1. 四个身份量与优先级

| 优先级 | 量 | 存放 | 含义 | 写入者 |
| --- | --- | --- | --- | --- |
| 1（最强） | 运行时锁 `__LOCKED_LOGIN_COHORT_ID__` | 内存 + sessionStorage | 本次登录会话**允许**操作的届别 | `lockRuntimeCohortId`（登录恢复、切届入口） |
| 2 | `CURRENT_COHORT_ID` | 内存 + localStorage | 工作区当前届别 | `writeWorkspaceCohortId`（切届完成、恢复完成） |
| 3 | `CURRENT_PROJECT_KEY`（`cohort::YYYY`） | localStorage / 云端 | 自动保存与云端载荷的键 | `writeWorkspaceProjectKey` |
| 4（最弱） | `CURRENT_EXAM_ID` | 内存 + localStorage | 当前考试；其前缀 `YYYY级` 可**推断**届别 | `persistWorkspaceExamIdentity` |

规则：
- **读侧**判断“来料属于哪一届”时，显式声明的身份（patch 里的 `currentExamId/currentCohortId`）优先于任何存储中的指针；只有没有显式身份时才退到 4→3→2 推断。
- **锁**只用于“允许/拒绝”，不用于“推断”。锁定届别 = 目标届别时，读侧陈旧指针不得阻止为该届拉取/套用数据。
- 旧指针属于**别的届别**是正常现象（跨设备、切届竞速、legacy 单场考试 key），不是错误：守卫要挡的是**数据**跨届，不是**指针**跨届。

## 2. 守卫清单（读侧 / 写侧必须对称）

| 位置 | 方向 | 守卫内容 | 例外 |
| --- | --- | --- | --- |
| `app.js syncDataRuntimeState` | 读（写入运行时） | 来料行的届别 ≠ 活动届别 → 整批拒绝 | 来料未带行数据时不检查 |
| `app.js setRawData` | 读 | 当前考试届别 ≠ 锁 → 拒绝 | — |
| `cohort-db-core applyExamToWorkspace` | 读 | 考试届别 ≠ 当前届别 → 拒绝；**必须**把 `examId` 显式传给 `syncDataRuntimeState` | `allowCrossCohort` |
| `cohort-db-core syncCurrentExam` | **写**（存档） | 考试届别 ≠ db 届别 → 拒绝写入 | — |
| `cloud-workspace fetchCohortExamsToLocal` | 读（拉云端） | 目标届别 ≠ `CURRENT_COHORT_ID` → 跳过 | 目标 = 锁定届别时放行 |
| `data-processing-orchestrator run` | 写（回写计算结果） | Worker 提交时的 `RAW_DATA` 引用或届别已变 → 整轮作废 | — |
| `auth-login 会话恢复` | 读 | 全局“上次工作区”指针被挡后，按**锁定届别**拉该届最新考试 | — |

## 3. 已知的历史坑（回归测试锁定）

1. 套用考试先写数据再写 `CURRENT_EXAM_ID`，守卫读到旧指针误拦本届数据 → 空工作区死局。（`2920f988`）
2. 切届清空后，上一届 `processData` 的 Worker 结果回写，旧数据顶着新届身份复活。（`2920f988`）
3. `syncCurrentExam` 无写侧守卫，把外届考试写进本届库并上云。（`2920f988`）
4. 会话恢复只信全局指针；指针指向别届即宣告失败。（`2920f988`）
