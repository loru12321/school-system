# NexusBank UI Figma Spec

## Tool

- Design tool: Figma
- Suggested desktop frame: `1440 x 1024`
- Suggested mobile frame: `390 x 844`
- Grid: desktop `12 columns`, mobile `4 columns`
- Base spacing unit: `8pt`

## Color Tokens

- Brand ink: `#071521`
- Brand deep teal: `#0F766E`
- Brand cyan: `#38BDF8`
- Brand mint: `#5EEAD4`
- Warning amber: `#F59E0B`
- Alert rose: `#FB7185`
- Page background: `#EDF3F8`
- Card surface: `rgba(255,255,255,0.92)`
- Border: `rgba(7,21,33,0.10)`

## Typography

- Primary font: `Aptos / Segoe UI Variable Text / PingFang SC / Microsoft YaHei UI`
- Display font: `Aptos Display / Segoe UI Variable Display / PingFang SC / Microsoft YaHei UI`
- Dashboard title: `20-30px / 800`
- Card metric: `22-30px / 800`
- Supporting meta: `11-13px / 700`

## Radius And Shadow

- Page-level card radius: `24px`
- Standard card radius: `20px`
- Control radius: `16px`
- Main shadow: `0 24px 55px rgba(7, 21, 33, 0.08)`
- Emphasis shadow: `0 32px 72px rgba(7, 21, 33, 0.16)`

## Layout Rules

- Dashboard hero uses dark gradient background plus high-contrast data chips.
- Summary cards keep one primary metric, one short label row, one secondary meta row.
- Trend/chart cards should span two columns on desktop and collapse to one column on mobile.
- Tables use light header bands, low-contrast dividers, and stronger hover highlight to maintain scanability.

## Chart Rules

- Positive/primary line: `#14B8A6`
- Comparison line: `#38BDF8`
- Warning/emphasis line: `#F97316`
- Grid lines use `rgba(18, 48, 74, 0.08)`
- Preferred chart feel: soft area fill + one solid trend + one dashed comparison line

## Component Notes

- `analysis-hero`: dark control-center banner with light text and glass scan cards.
- `tm-stat-card-inner`: premium KPI cards with a subtle highlight orb.
- `fb-card--chart`: finance-style curve panel for school trend comparison.
- `upload-summary-card`: structured import status cards with clearer hierarchy.
- `mq-module-card`: mobile cards use the same color language and radius scale as desktop.

## Responsive Rules

- Desktop card grids: min width `220px`
- Mobile card radius reduces from `24px` to `20px`
- Chart cards collapse from `span 2` to `span 1` under `960px`
- Keep hero/banner padding at `16px` on small screens
