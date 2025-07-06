# 📋 Development Checklist – RN-COSM-VENUE-APP

> **Last Updated:** 2025-07-04
> **Version:** 1.0 – Develop → Feature Branch → Develop Workflow

This checklist is **MANDATORY** for all development tasks in this React Native project.

---

## 🛠 1. Preparation & Task Start

1. **Task Number**
   - Use the task number from task master.

2. **Create Feature Branch**
   - Always branch from `develop`:

     ```bash
     git checkout develop
     git pull
     git checkout -b <TASK_NUMBER>
     ```

     if the develop branch does not exist, please, create the develop branch based in the master branch

   - **Branch name = `task/<TASK_NUMBER>`**.

3. **Sync**
   - Ensure `develop` is up to date before starting work.

---

## 🔍 2. Development & Quality

standard QA sequence:

```bash
npm run lint
npm run test
npm run typecheck
npm run ci-test
```

1. Run QA sequence before coding in order to check if everything is ok. If it fails for some reason fix it

2. **Implement Feature/Fix**
   - Code your changes in the feature branch.

3. Create tests for the fixes or features that you implement

4. commit and push. if the push fails, fix the error. we have a husky hook that runs the QA
   sequence before perform the push

---

## 📝 3. Progress Logging

For each task, **update the file `docs/progress.md`** at the repository root with:

- **Task Number**
- **Task Title** (brief description)
- **Timestamp** (YYYY-MM-DD HH\:mm\:ss)
- **Technical Decisions** (frameworks, patterns, libraries)
- **Implementation Status** (in progress, ready for review, completed)

**Example entry in `docs/progress.md`:**

```markdown
### vst-0001 – New Events Screen

**Date:** 2025-07-04 14:30:00  
**Decisions:** Using `react-native` + `@shopify/flash-list` for performance; folder structure under `src/features/events`.  
**Status:** In progress
```

---

## ✅ 4. Commit & Pull Request

1. **Stage & Commit**

   ```bash
   git add -A
   git commit -m "<type>(<TASK_NUMBER>): <short description>"
   ```

   - `<type>` → `feat`, `fix`, or `test`
   - `<TASK_NUMBER>` exactly as the branch name (e.g., `vst-0001`)
   - Example:

     ```bash
     git commit -m "feat(vst-0001): implement events screen"
     ```

2. **Push & Open PR**

   ```bash
   git push origin <TASK_NUMBER>
   ```

- Open a pull request **against `develop`**.
- PR title: `<TASK_NUMBER> – short description`
- generate a good PR and remember that we will use this PR as documentation

---

## 🚀 5. Quick Flow Summary

1. Ask: **What is the task number?**
2. `git checkout develop && git pull`
3. `git checkout -b <TASK_NUMBER>`
4. Develop → `npm run lint && npm run typecheck && npm run test`
5. Code
6. Run QA before commit
7. Update `docs/progress.md`
8. `git add -A && git commit -m "<type>(<TASK_NUMBER>): ..."`
9. `git push origin <TASK_NUMBER>` + open PR to `develop`

---

> **Note:** Update this checklist as new requirements emerge.
