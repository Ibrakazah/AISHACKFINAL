
"""
Smart Schedule Generator — replaces the body of generate_fast() in main.py
The replacement block goes from:
    for item in queue:   (the DEAD LOOP at line 932)
down to the line:
    placed += 1          (end of the second real loop)

Strategy:
  1. Keep lents logic untouched.
  2. Build queue from matrix (strict teacher assignments + generic subjects).
  3. Sort queue: strict first, then by hours-descending (hardest to place first).
  4. For each queue item, spread lessons EVENLY across days:
       - prefer days where this subject is NOT yet scheduled for that class
       - prefer early time slots
       - enforce max 1 lesson / subject / class / day (2 if hoursPerWeek > 5)
  5. Teacher selection: pick the teacher with the lowest day-load who can teach the subject.
  6. Room selection: deterministic by room-type preference.
"""
import re

filepath = r'c:\Users\User\Downloads\Учительский веб-сайт\server\main.py'
with open(filepath, 'r', encoding='utf-8') as f:
    src = f.read()

# ── locate the dead first loop and the real second loop ──────────────────────
DEAD_LOOP_START = "    for item in queue:\n        placed = 0\n        sl = item[\"subject\"].lower()\n        is_pe = any(p in sl for p in pe)\n        is_phys = sl in phys\n        pref_types = [\"gym\"] if is_pe else [\"lab\", \"classroom\"] if is_phys else [\"classroom\", \"lab\"]\n        \n    # Define all available slots in a linear order (stable)\n    all_slots"
END_MARKER = "            placed += 1\n\n    return {"

start_idx = src.find(DEAD_LOOP_START)
if start_idx == -1:
    # Try without the dead loop already removed
    DEAD_LOOP_START = "    # Define all available slots in a linear order (stable)\n    all_slots"
    start_idx = src.find(DEAD_LOOP_START)

if start_idx == -1:
    print("ERROR: could not find start marker")
    exit(1)

end_idx = src.find(END_MARKER, start_idx)
if end_idx == -1:
    print("ERROR: could not find end marker")
    exit(1)
end_idx += len(END_MARKER)   # include the matched text

print(f"Found block start at char {start_idx}, end at {end_idx}")

NEW_ALGO = r"""    # ── Define day-ordered slots (mornings first) ────────────────────────────
    days_ordered = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"]
    all_slots = [{"day": d, "time": t} for d in days_ordered for t in time_slots]

    # Per-class, per-subject, per-day counter  { cls: { subj_lower: { day: count } } }
    cls_subj_day = {}

    for item in queue:
        placed    = 0
        target    = item["hours"]          # exact hours from matrix — MUST be met
        sl        = item["subject"].lower()
        is_pe     = any(p in sl for p in pe)
        is_phys   = sl in phys
        pref_types = ["gym"] if is_pe else ["lab", "classroom"] if is_phys else ["classroom", "lab"]

        # max same-subject lessons per day for this class
        max_per_day = 2 if target > 5 else 1

        # Build a smart slot order: prefer days where subject is missing, then by slot index
        def slot_priority(s):
            d, t_idx = s["day"], time_slots.index(s["time"])
            already_today = cls_subj_day.get(item["cls"], {}).get(sl, {}).get(d, 0)
            # (already_today, day_index, time_index) — spread across days first
            return (already_today, days_ordered.index(d), t_idx)

        sorted_slots = sorted(all_slots, key=slot_priority)

        for slot in sorted_slots:
            if placed >= target:
                break
            d, t = slot["day"], slot["time"]

            # ── Guard 1: daily subject cap ────────────────────────────────────
            if cls_subj_day.get(item["cls"], {}).get(sl, {}).get(d, 0) >= max_per_day:
                continue

            # ── Guard 2: class slot free? ─────────────────────────────────────
            if not is_free(item["cls"], None, None, d, t):
                continue

            # ── Teacher selection ─────────────────────────────────────────────
            sel_t = None
            if item["teacher"]:
                for gt in gen_teachers:
                    if gt["name"] == item["teacher"]:
                        if (is_free(None, None, item["teacher"], d, t) and
                                teacher_day_load.get(item["teacher"], {}).get(d, 0) < gt["limitDay"] and
                                teacher_week_load.get(item["teacher"], 0) < gt["limitWeek"]):
                            sel_t = item["teacher"]
                        break
            else:
                capable = [
                    gt for gt in gen_teachers
                    if sl in gt["lowerSubjects"]
                    and is_free(None, None, gt["name"], d, t)
                    and teacher_day_load.get(gt["name"], {}).get(d, 0) < gt["limitDay"]
                    and teacher_week_load.get(gt["name"], 0) < gt["limitWeek"]
                ]
                if capable:
                    # prefer teacher with least load today, then least load this week
                    capable.sort(key=lambda x: (
                        teacher_day_load.get(x["name"], {}).get(d, 0),
                        teacher_week_load.get(x["name"], 0)
                    ))
                    sel_t = capable[0]["name"]

            if not sel_t:
                continue

            # ── Room selection ────────────────────────────────────────────────
            sel_r = None
            for ptype in pref_types:
                free_rr = [r["name"] for r in rooms
                           if r.get("type") == ptype and is_free(None, r["name"], None, d, t)]
                if free_rr:
                    sel_r = free_rr[0]
                    break

            if not sel_r:
                continue

            # ── Place the lesson ──────────────────────────────────────────────
            schedule[item["cls"]][d][t] = {
                "subject": item["subject"],
                "teacher": sel_t,
                "room":    sel_r,
            }
            mark_busy(item["cls"], sel_r, sel_t, d, t)

            # update per-day subject tracker
            cls_subj_day.setdefault(item["cls"], {}).setdefault(sl, {})
            cls_subj_day[item["cls"]][sl][d] = cls_subj_day[item["cls"]][sl].get(d, 0) + 1

            total_lessons += 1
            placed += 1

        if placed < target:
            conflict_reasons.append(
                f"Класс {item['cls']}: {item['subject']} — размещено {placed}/{target} ч. "
                f"(не хватило {'учителя' if not item['teacher'] else 'слотов'})"
            )
            conflicts += 1

    return {"""

new_src = src[:start_idx] + NEW_ALGO + src[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_src)

lines_before = src[:start_idx].count('\n') + 1
lines_after  = src[:end_idx].count('\n') + 1
print(f"SUCCESS - replaced ~{lines_after - lines_before} lines with smart algorithm ({NEW_ALGO.count(chr(10))} new lines)")
