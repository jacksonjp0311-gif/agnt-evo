@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\agnt-evo\improve-AGNT
git add -A
git status
git commit -m "feat: add AGNT plugin adaptation of shadcn/improve agent skill

Adds 5 native AGNT workflow tools that bring the shadcn/improve
codebase audit and implementation planning skill to AGNT:

- improve_audit: Full/focused codebase audit with prioritized findings
- improve_plan: Self-contained implementation plan writer (handoff format)
- improve_reconcile: Plan backlog reconciliation and drift detection
- improve_review_plan: Plan critique against shadcn/improve template (10 dimensions)
- improve_branch_audit: Branch-scoped audit for PR readiness

Source: https://github.com/shadcn/improve"
git push origin main
echo Push complete!
