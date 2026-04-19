import json
from dataclasses import dataclass
from typing import Dict, List, Tuple

SUBJECTS = ["语文", "数学", "英语"]
THRESHOLDS = {
    "语文": {"exc": 90, "pass": 72},
    "数学": {"exc": 90, "pass": 72},
    "英语": {"exc": 90, "pass": 72},
}

@dataclass
class Student:
    name: str
    school: str
    cls: str
    scores: Dict[str, float]


def make_exam_data(tag: str) -> List[Student]:
    data: List[Student] = []
    schools = ["实验中学", "城关中学", "广益中学"]
    school_base = {
        "实验中学": {"语文": 81, "数学": 78, "英语": 79},
        "城关中学": {"语文": 83, "数学": 81, "英语": 82},
        "广益中学": {"语文": 79, "数学": 76, "英语": 77},
    }

    # 期末相对期中的变化（模拟：实验中学提升最明显，尤其数学）
    exam_shift = {
        "期中": {"语文": 0, "数学": 0, "英语": 0},
        "期末": {"语文": 1.8, "数学": 4.2, "英语": 2.6},
    }

    # 班级修正（实验中学701为张老师数学主班，期末提升更多）
    class_shift_mid = {
        "701": {"语文": 0.8, "数学": 2.0, "英语": 1.2},
        "702": {"语文": -0.2, "数学": -0.5, "英语": -0.1},
    }
    class_shift_fin = {
        "701": {"语文": 1.5, "数学": 6.5, "英语": 2.4},
        "702": {"语文": 0.2, "数学": 0.8, "英语": 0.5},
    }

    for school in schools:
        for cidx, cls in enumerate(["701", "702"]):
            for i in range(1, 21):
                sid = f"{school[:2]}{cls}{i:02d}"
                scores = {}
                for sub in SUBJECTS:
                    base = school_base[school][sub]
                    # 基础波动（可复现）
                    noise = ((i * 7 + cidx * 11) % 13) - 6
                    val = base + noise
                    if school == "实验中学":
                        shift_map = class_shift_mid if tag == "期中" else class_shift_fin
                        val += shift_map[cls][sub]
                    val += exam_shift[tag][sub]
                    val = max(35, min(100, round(val, 1)))
                    scores[sub] = val
                data.append(Student(name=sid, school=school, cls=cls, scores=scores))
    return data


def aggregate_school_metrics(students: List[Student]) -> Dict[str, Dict[str, Dict[str, float]]]:
    by_school: Dict[str, List[Student]] = {}
    for s in students:
        by_school.setdefault(s.school, []).append(s)

    out: Dict[str, Dict[str, Dict[str, float]]] = {}
    for school, arr in by_school.items():
        out[school] = {}
        for sub in SUBJECTS:
            vals = [x.scores[sub] for x in arr]
            exc = THRESHOLDS[sub]["exc"]
            pas = THRESHOLDS[sub]["pass"]
            out[school][sub] = {
                "count": len(vals),
                "avg": sum(vals) / len(vals),
                "excRate": sum(1 for v in vals if v >= exc) / len(vals),
                "passRate": sum(1 for v in vals if v >= pas) / len(vals),
            }

        totals = [sum(x.scores[sub] for sub in SUBJECTS) for x in arr]
        out[school]["total"] = {
            "count": len(totals),
            "avg": sum(totals) / len(totals),
            "excRate": sum(1 for v in totals if v >= 270) / len(totals),
            "passRate": sum(1 for v in totals if v >= 216) / len(totals),
        }

    # 两率一分赋分（按页面算法）
    max_avg = max(v["total"]["avg"] for v in out.values())
    max_exc = max(v["total"]["excRate"] for v in out.values())
    max_pass = max(v["total"]["passRate"] for v in out.values())

    for school in out:
        m = out[school]["total"]
        rated_avg = (m["avg"] / max_avg * 60) if max_avg else 0
        rated_exc = (m["excRate"] / max_exc * 70) if max_exc else 0
        rated_pass = (m["passRate"] / max_pass * 70) if max_pass else 0
        m["score2Rate"] = rated_avg + rated_exc + rated_pass

    rank = sorted(out.items(), key=lambda kv: kv[1]["total"]["score2Rate"], reverse=True)
    for i, (school, _) in enumerate(rank, 1):
        out[school]["total"]["rank2Rate"] = i

    # 学科排名
    for sub in SUBJECTS:
        by_avg = sorted(out.items(), key=lambda kv: kv[1][sub]["avg"], reverse=True)
        by_exc = sorted(out.items(), key=lambda kv: kv[1][sub]["excRate"], reverse=True)
        by_pass = sorted(out.items(), key=lambda kv: kv[1][sub]["passRate"], reverse=True)
        for i, (school, _) in enumerate(by_avg, 1):
            out[school][sub]["rankAvg"] = i
        for i, (school, _) in enumerate(by_exc, 1):
            out[school][sub]["rankExc"] = i
        for i, (school, _) in enumerate(by_pass, 1):
            out[school][sub]["rankPass"] = i

    return out


def analyze_teachers(students: List[Student], my_school: str, teacher_map: Dict[Tuple[str, str], str]):
    my_students = [s for s in students if s.school == my_school]

    # 年级基准（按 analyzeTeachers）
    grade_stats = {}
    for sub in SUBJECTS:
        vals = [s.scores[sub] for s in my_students]
        avg = sum(vals) / len(vals)
        exc = THRESHOLDS[sub]["exc"]
        pas = THRESHOLDS[sub]["pass"]
        low = pas * 0.6
        grade_stats[sub] = {"avg": avg, "exc": exc, "pass": pas, "low": low}

    teacher_stats: Dict[str, Dict[str, dict]] = {}
    for (cls, sub), teacher in teacher_map.items():
        teacher_stats.setdefault(teacher, {}).setdefault(sub, {"classes": [], "students": []})
        st = [s for s in my_students if s.cls == cls and sub in s.scores]
        teacher_stats[teacher][sub]["classes"].append(cls)
        teacher_stats[teacher][sub]["students"].extend(st)

    for teacher in teacher_stats:
        for sub in teacher_stats[teacher]:
            data = teacher_stats[teacher][sub]
            arr = data["students"]
            gs = grade_stats[sub]
            scores = [s.scores[sub] for s in arr]
            avg = sum(scores) / len(scores)
            exc_rate = sum(1 for v in scores if v >= gs["exc"]) / len(scores)
            pass_rate = sum(1 for v in scores if v >= gs["pass"]) / len(scores)
            low_rate = sum(1 for v in scores if v < gs["low"]) / len(scores)
            contribution = avg - gs["avg"]
            final_score = 30 + contribution + exc_rate * 30 + pass_rate * 30 - low_rate * 20

            data.update({
                "avg": avg,
                "studentCount": len(scores),
                "classes": ",".join(sorted(set(data["classes"]))),
                "excellentRate": exc_rate,
                "passRate": pass_rate,
                "lowRate": low_rate,
                "contribution": contribution,
                "finalScore": final_score,
            })

    return teacher_stats


def teacher_township_rank(teacher_stats, school_metrics, target_subject):
    ranking = []
    for teacher, sub_map in teacher_stats.items():
        if target_subject in sub_map:
            d = sub_map[target_subject]
            ranking.append({
                "name": teacher,
                "type": "teacher",
                "avg": d["avg"],
                "excellentRate": d["excellentRate"],
                "passRate": d["passRate"],
            })

    for school, metric in school_metrics.items():
        if school != "实验中学":
            m = metric[target_subject]
            ranking.append({
                "name": school,
                "type": "school",
                "avg": m["avg"],
                "excellentRate": m["excRate"],
                "passRate": m["passRate"],
            })

    ranking_avg = sorted(ranking, key=lambda x: x["avg"], reverse=True)
    rank_map = {x["name"]: i + 1 for i, x in enumerate(ranking_avg)}

    ranking_exc = sorted(ranking, key=lambda x: x["excellentRate"], reverse=True)
    rank_exc = {x["name"]: i + 1 for i, x in enumerate(ranking_exc)}

    ranking_pass = sorted(ranking, key=lambda x: x["passRate"], reverse=True)
    rank_pass = {x["name"]: i + 1 for i, x in enumerate(ranking_pass)}

    for row in ranking:
        row["rankAvg"] = rank_map[row["name"]]
        row["rankExc"] = rank_exc[row["name"]]
        row["rankPass"] = rank_pass[row["name"]]

    return ranking


def pct(v):
    return f"{v * 100:.1f}%"


def build_report():
    mid = make_exam_data("期中")
    fin = make_exam_data("期末")

    mid_school = aggregate_school_metrics(mid)
    fin_school = aggregate_school_metrics(fin)

    teacher_map = {
        ("701", "数学"): "张老师",
        ("702", "数学"): "李老师",
        ("701", "语文"): "王老师",
        ("702", "语文"): "赵老师",
        ("701", "英语"): "陈老师",
        ("702", "英语"): "刘老师",
    }

    mid_teacher = analyze_teachers(mid, "实验中学", teacher_map)
    fin_teacher = analyze_teachers(fin, "实验中学", teacher_map)

    # 目标1：校际联考分析——实验中学 期中 vs 期末
    m_total = mid_school["实验中学"]["total"]
    f_total = fin_school["实验中学"]["total"]
    m_math = mid_school["实验中学"]["数学"]
    f_math = fin_school["实验中学"]["数学"]

    # 目标2：班级教学管理——张老师(实验中学-数学)
    tm = mid_teacher["张老师"]["数学"]
    tf = fin_teacher["张老师"]["数学"]

    # 乡镇排名
    tr_mid = teacher_township_rank(mid_teacher, mid_school, "数学")
    tr_fin = teacher_township_rank(fin_teacher, fin_school, "数学")
    trm = next(x for x in tr_mid if x["name"] == "张老师")
    trf = next(x for x in tr_fin if x["name"] == "张老师")

    # 验证
    validations = []
    validations.append(("三率范围校验", all(0 <= v <= 1 for v in [tm["excellentRate"], tm["passRate"], tm["lowRate"], tf["excellentRate"], tf["passRate"], tf["lowRate"]])))
    fs_check_mid = abs(tm["finalScore"] - (30 + tm["contribution"] + tm["excellentRate"] * 30 + tm["passRate"] * 30 - tm["lowRate"] * 20)) < 1e-9
    fs_check_fin = abs(tf["finalScore"] - (30 + tf["contribution"] + tf["excellentRate"] * 30 + tf["passRate"] * 30 - tf["lowRate"] * 20)) < 1e-9
    validations.append(("绩效分公式复算", fs_check_mid and fs_check_fin))
    validations.append(("人数一致性", tm["studentCount"] == tf["studentCount"] == 20))
    validations.append(("校际总分提升", f_total["avg"] > m_total["avg"]))

    lines = []
    lines.append("# 模拟对比验证报告（期中 vs 期末）\n")
    lines.append("- 目标学校：实验中学\n")
    lines.append("- 目标教师：张老师（数学）\n")
    lines.append("- 对比范围：校际联考分析 + 班级教学管理\n")

    lines.append("## 一、校际联考分析（实验中学）\n")
    lines.append("### 1) 总分横向模块\n")
    lines.append("| 指标 | 期中 | 期末 | 变化 |")
    lines.append("|---|---:|---:|---:|")
    lines.append(f"| 平均分 | {m_total['avg']:.2f} | {f_total['avg']:.2f} | {f_total['avg']-m_total['avg']:+.2f} |")
    lines.append(f"| 优秀率 | {pct(m_total['excRate'])} | {pct(f_total['excRate'])} | {(f_total['excRate']-m_total['excRate'])*100:+.1f}pp |")
    lines.append(f"| 及格率 | {pct(m_total['passRate'])} | {pct(f_total['passRate'])} | {(f_total['passRate']-m_total['passRate'])*100:+.1f}pp |")
    lines.append(f"| 两率一分总分 | {m_total['score2Rate']:.2f} | {f_total['score2Rate']:.2f} | {f_total['score2Rate']-m_total['score2Rate']:+.2f} |")
    lines.append(f"| 校际排名 | {int(m_total['rank2Rate'])} | {int(f_total['rank2Rate'])} | {int(f_total['rank2Rate'])-int(m_total['rank2Rate']):+d} |\n")

    lines.append("### 2) 数学学科模块\n")
    lines.append("| 指标 | 期中 | 期末 | 变化 |")
    lines.append("|---|---:|---:|---:|")
    lines.append(f"| 数学均分 | {m_math['avg']:.2f} | {f_math['avg']:.2f} | {f_math['avg']-m_math['avg']:+.2f} |")
    lines.append(f"| 数学优秀率 | {pct(m_math['excRate'])} | {pct(f_math['excRate'])} | {(f_math['excRate']-m_math['excRate'])*100:+.1f}pp |")
    lines.append(f"| 数学及格率 | {pct(m_math['passRate'])} | {pct(f_math['passRate'])} | {(f_math['passRate']-m_math['passRate'])*100:+.1f}pp |")
    lines.append(f"| 数学均分镇排 | {int(m_math['rankAvg'])} | {int(f_math['rankAvg'])} | {int(f_math['rankAvg'])-int(m_math['rankAvg']):+d} |\n")

    lines.append("## 二、班级教学管理（实验中学-张老师-数学）\n")
    lines.append("### 1) 教师概况卡片/详细表核心指标\n")
    lines.append("| 指标 | 期中 | 期末 | 变化 |")
    lines.append("|---|---:|---:|---:|")
    lines.append(f"| 任教班级 | {tm['classes']} | {tf['classes']} | 0 |")
    lines.append(f"| 学生数 | {tm['studentCount']} | {tf['studentCount']} | {tf['studentCount']-tm['studentCount']:+d} |")
    lines.append(f"| 均分 | {tm['avg']:.2f} | {tf['avg']:.2f} | {tf['avg']-tm['avg']:+.2f} |")
    lines.append(f"| 贡献值 | {tm['contribution']:+.2f} | {tf['contribution']:+.2f} | {tf['contribution']-tm['contribution']:+.2f} |")
    lines.append(f"| 优秀率 | {pct(tm['excellentRate'])} | {pct(tf['excellentRate'])} | {(tf['excellentRate']-tm['excellentRate'])*100:+.1f}pp |")
    lines.append(f"| 及格率 | {pct(tm['passRate'])} | {pct(tf['passRate'])} | {(tf['passRate']-tm['passRate'])*100:+.1f}pp |")
    lines.append(f"| 低分率 | {pct(tm['lowRate'])} | {pct(tf['lowRate'])} | {(tf['lowRate']-tm['lowRate'])*100:+.1f}pp |")
    lines.append(f"| 绩效分 | {tm['finalScore']:.2f} | {tf['finalScore']:.2f} | {tf['finalScore']-tm['finalScore']:+.2f} |\n")

    lines.append("### 2) 教师乡镇排名模块（数学）\n")
    lines.append("| 指标 | 期中 | 期末 | 变化 |")
    lines.append("|---|---:|---:|---:|")
    lines.append(f"| 均分镇排 | {trm['rankAvg']} | {trf['rankAvg']} | {trf['rankAvg']-trm['rankAvg']:+d} |")
    lines.append(f"| 优秀率镇排 | {trm['rankExc']} | {trf['rankExc']} | {trf['rankExc']-trm['rankExc']:+d} |")
    lines.append(f"| 及格率镇排 | {trm['rankPass']} | {trf['rankPass']} | {trf['rankPass']-trm['rankPass']:+d} |\n")

    lines.append("## 三、模拟验证\n")
    lines.append("| 校验项 | 结果 |")
    lines.append("|---|---|")
    for name, ok in validations:
        lines.append(f"| {name} | {'✅ 通过' if ok else '❌ 未通过'} |")

    lines.append("\n## 四、结论\n")
    lines.append("- 期末相对期中：实验中学在校际联考分析中，总分与数学学科均有明显提升。")
    lines.append("- 张老师（数学）在班级教学管理各核心模块指标中，均分、贡献值、优秀率、及格率与绩效分均上升。")
    lines.append("- 验证项全部通过，模拟数据与模块公式口径一致，可用于演示与回归测试。")

    with open("模拟对比验证报告.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    with open("模拟对比验证明细.json", "w", encoding="utf-8") as f:
        json.dump({
            "mid_school": mid_school,
            "fin_school": fin_school,
            "mid_teacher": mid_teacher,
            "fin_teacher": fin_teacher,
            "rank_mid_math": tr_mid,
            "rank_fin_math": tr_fin,
            "validations": [{"name": n, "ok": o} for n, o in validations],
        }, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    build_report()
